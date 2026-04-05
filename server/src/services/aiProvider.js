const axios = require("axios");

function normalizeProviderName(value, options = {}) {
  const { allowAuto = true } = options;
  const provider = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (["ollama", "openai", "gemini", "huggingface", "hf"].includes(provider)) {
    return provider === "hf" ? "huggingface" : provider;
  }

  if (!allowAuto) {
    return "";
  }

  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    return "gemini";
  }

  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }

  if (process.env.HUGGING_FACE_API_KEY) {
    return "huggingface";
  }

  return "ollama";
}

function isQuotaOrRateLimitError(error) {
  const status = Number(error?.status || error?.response?.status || 0);
  if (status === 429) {
    return true;
  }

  const message = String(error?.message || "").toLowerCase();
  return ["quota", "rate limit", "resource_exhausted", "too many requests"].some((token) => message.includes(token));
}

function toProviderError(error, defaultMessage) {
  const status = error?.response?.status;
  const providerMessage = error?.response?.data?.error?.message || error?.response?.data?.message;

  const wrapped = new Error(providerMessage || error.message || defaultMessage);
  if (status) {
    wrapped.status = status;
  }
  wrapped.raw = error;
  return wrapped;
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

async function callHuggingFace({ systemPrompt, userPrompt, maxTokens = 700 }) {
  const apiKey = process.env.HUGGING_FACE_API_KEY;
  if (!apiKey) {
    throw new Error("HUGGING_FACE_API_KEY is not configured");
  }

  const model = process.env.HUGGING_FACE_MODEL || "google/flan-t5-small";
  const prompt = `${systemPrompt}\n\n${userPrompt}`;

  try {
    const response = await axios.post(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: Math.max(120, Math.min(1500, Number(maxTokens || 700)))
        }
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 45000
      }
    );

    const data = response.data;
    let text = "";

    if (Array.isArray(data) && data[0]?.generated_text) {
      text = String(data[0].generated_text || "").trim();
    } else if (typeof data?.generated_text === "string") {
      text = data.generated_text.trim();
    } else if (typeof data === "string") {
      text = data.trim();
    }

    return {
      text,
      meta: {
        provider: "huggingface",
        model
      }
    };
  } catch (error) {
    const wrapped = toProviderError(error, "Hugging Face request failed");
    if (wrapped.status === 401 || wrapped.status === 403) {
      throw new Error("Hugging Face token does not have Inference Provider permission. Update token scopes or use a different secondary provider.");
    }
    throw wrapped;
  }
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

async function callGemini({ systemPrompt, userPrompt, temperature = 0.3, maxTokens = 700, jsonMode = false }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is not configured");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const baseUrl = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";

  let response;

  try {
    response = await axios.post(
      `${baseUrl}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: withJsonInstruction(userPrompt, jsonMode) }]
          }
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: jsonMode ? "application/json" : "text/plain"
        }
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 45000
      }
    );
  } catch (error) {
    const wrapped = toProviderError(error, "Gemini request failed");
    if (wrapped.status === 401 || wrapped.status === 403) {
      throw new Error(wrapped.message || "Gemini authentication failed. Check your Google API key and model permissions.");
    }
    throw wrapped;
  }

  const parts = response.data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((part) => (typeof part?.text === "string" ? part.text : "")).join("\n").trim()
    : "";

  return {
    text,
    meta: {
      provider: "gemini",
      model
    }
  };
}

async function callProvider(provider, options) {
  if (provider === "gemini") {
    return callGemini(options);
  }

  if (provider === "openai") {
    return callOpenAI(options);
  }

  if (provider === "huggingface") {
    return callHuggingFace(options);
  }

  if (provider === "ollama") {
    return callOllama(options);
  }

  return callOllama(options);
}

async function callAI(options) {
  const primaryProvider = normalizeProviderName(process.env.AI_PROVIDER);
  const secondaryProvider = normalizeProviderName(process.env.AI_SECONDARY_PROVIDER, { allowAuto: false });
  const fallbackOnAnyError = String(process.env.AI_FALLBACK_ON_ANY_ERROR || "").toLowerCase() === "true";

  try {
    return await callProvider(primaryProvider, options);
  } catch (error) {
    const canFallback = secondaryProvider && secondaryProvider !== primaryProvider;
    const shouldFallback = fallbackOnAnyError || isQuotaOrRateLimitError(error);

    if (!canFallback || !shouldFallback) {
      throw error;
    }

    try {
      return await callProvider(secondaryProvider, options);
    } catch (secondaryError) {
      // Keep the primary provider error message clean for end users.
      throw error;
    }
  }
}

module.exports = {
  callAI
};
