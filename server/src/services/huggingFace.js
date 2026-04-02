const axios = require("axios");

async function generateRecommendation(subjectScores, weakSubjects) {
  const apiKey = process.env.HUGGING_FACE_API_KEY;
  const model = process.env.HUGGING_FACE_MODEL || "google/flan-t5-small";

  const prompt = [
    "You are a study coach for Ethiopian university exit exam students.",
    `Subject scores (0 to 5): ${JSON.stringify(subjectScores)}.`,
    `Weak subjects: ${weakSubjects.join(", ") || "none"}.`,
    "Give a concise 4-6 sentence weekly study plan with specific focus order."
  ].join(" ");

  if (!apiKey) {
    if (weakSubjects.length === 0) {
      return "Great progress so far. Continue practicing mixed questions and take one timed simulation this week to maintain performance.";
    }

    return `Focus this week on ${weakSubjects.join(", ")}. Review the lowest-scoring topics first, study one chapter per day, and complete at least 10 practice questions per weak subject.`;
  }

  const url = `https://api-inference.huggingface.co/models/${model}`;

  try {
    const response = await axios.post(
      url,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    const data = response.data;

    if (Array.isArray(data) && data[0] && data[0].generated_text) {
      return data[0].generated_text.trim();
    }

    if (typeof data === "string") {
      return data;
    }

    if (data && data.generated_text) {
      return data.generated_text.trim();
    }

    return "Keep practicing weak subjects and schedule one timed assessment every two days.";
  } catch (_error) {
    return `Prioritize ${weakSubjects.join(", ") || "your lowest topics"} and complete focused revision with daily timed practice.`;
  }
}

module.exports = {
  generateRecommendation
};
