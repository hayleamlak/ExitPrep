const axios = require("axios");

function normalizeProviderName(value) {
  const provider = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (["ollama", "openai"].includes(provider)) {
    return provider;
  }
  return "ollama";
}

function withJsonInstruction(prompt, jsonMode) {
  if (!jsonMode) {
    return prompt;
  }

  return `${prompt}\n\nReturn valid JSON only. Do not include markdown fences or extra commentary.`;
}

async function callOllama({ systemPrompt, userPrompt, temperature = 0.3, maxTokens = 700, jsonMode = false }) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.1";
  const prompt = `${systemPrompt}\n\n${withJsonInstruction(userPrompt, jsonMode)}`;

  const response = await axios.post(
    `${baseUrl}/api/generate`,
    {
      model,
      prompt,
      stream: false,
      options: {
        temperature,
        num_predict: maxTokens
      }
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 45000
    }
  );

  return {
    text: typeof response.data?.response === "string" ? response.data.response.trim() : "",
    meta: {
      provider: "ollama",
      model
    }
  };
}

async function callOpenAI({ systemPrompt, userPrompt, temperature = 0.3, maxTokens = 700, jsonMode = false }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com";

  const response = await axios.post(
    `${baseUrl}/v1/chat/completions`,
    {
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: withJsonInstruction(userPrompt, jsonMode) }
      ],
      response_format: jsonMode ? { type: "json_object" } : undefined
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 45000
    }
  );

  return {
    text: typeof response.data?.choices?.[0]?.message?.content === "string"
      ? response.data.choices[0].message.content.trim()
      : "",
    meta: {
      provider: "openai",
      model
    }
  };
}

async function callAI(options) {
  const provider = normalizeProviderName(process.env.AI_PROVIDER);

  if (provider === "openai") {
    return callOpenAI(options);
  }

  if (provider === "ollama") {
    return callOllama(options);
  }

  return callOllama(options);
}

module.exports = {
  callAI
};
