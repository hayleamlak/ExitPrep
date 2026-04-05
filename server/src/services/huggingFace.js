const { callAI } = require("./aiProvider");

async function generateRecommendation(subjectScores, weakSubjects) {
  try {
    const systemPrompt = "You are a study coach for Ethiopian university exit exam students.";
    const userPrompt = [
      `Subject scores (0 to 5): ${JSON.stringify(subjectScores)}.`,
      `Weak subjects: ${weakSubjects.join(", ") || "none"}.`,
      "Generate a personalized weekly recommendation in 4-6 concise sentences.",
      "The recommendation must include focus order and daily action items."
    ].join(" ");

    const ai = await callAI({
      systemPrompt,
      userPrompt,
      temperature: 0.55,
      maxTokens: 380
    });

    if (typeof ai?.text === "string" && ai.text.trim()) {
      return ai.text.trim();
    }
  } catch (_error) {
    // fall through to deterministic fallback
  }

  if (weakSubjects.length === 0) {
    return "Great progress so far. Continue practicing mixed questions and take one timed simulation this week to maintain performance.";
  }

  return `Focus this week on ${weakSubjects.join(", ")}. Review the lowest-scoring topics first, study one chapter per day, and complete at least 10 practice questions per weak subject.`;
}

module.exports = {
  generateRecommendation
};
