const User = require("../models/User");
const AIAnalytics = require("../models/AIAnalytics");
const { toAverageMap, weakSubjectsFromScores } = require("../utils/analytics");
const { generateRecommendation } = require("../services/huggingFace");
const { callAI } = require("../services/aiProvider");

function extractJsonObject(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    // no-op
  }

  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeFenceMatch?.[1]) {
    try {
      return JSON.parse(codeFenceMatch[1]);
    } catch (_error) {
      // no-op
    }
  }

  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch (_error) {
      // no-op
    }
  }

  return null;
}

function normalizeTopicPerformance(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      topic: typeof item?.topic === "string" ? item.topic.trim() : "",
      accuracy: Number(item?.accuracy || item?.accuracyPercentage || 0)
    }))
    .filter((item) => item.topic);
}

async function summarizeNotes(req, res) {
  try {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    const subject = typeof req.body?.subject === "string" && req.body.subject.trim() ? req.body.subject.trim() : "General";

    if (!text) {
      return res.status(400).json({ message: "text is required" });
    }

    const systemPrompt = "You are an exam prep tutor for Ethiopian university students. Keep responses concise and practical.";
    const userPrompt = [
      `Subject: ${subject}`,
      "Summarize the study content below.",
      "Return JSON with keys: shortSummary (string), keyPoints (string[]), examTips (string[]).",
      "Keep language simple and student-friendly.",
      `Content:\n${text}`
    ].join("\n\n");

    const ai = await callAI({ systemPrompt, userPrompt, jsonMode: true, maxTokens: 800 });
    const parsed = extractJsonObject(ai.text);

    const fallback = {
      shortSummary: text.slice(0, 280),
      keyPoints: ["Review definitions", "Practice with examples", "Revisit weak areas"],
      examTips: ["Use active recall", "Solve timed questions", "Track mistakes after each session"]
    };

    const data = {
      shortSummary: typeof parsed?.shortSummary === "string" ? parsed.shortSummary : fallback.shortSummary,
      keyPoints: Array.isArray(parsed?.keyPoints) ? parsed.keyPoints.slice(0, 7) : fallback.keyPoints,
      examTips: Array.isArray(parsed?.examTips) ? parsed.examTips.slice(0, 5) : fallback.examTips
    };

    return res.json({ ok: true, feature: "summarize", data, meta: { ...ai.meta, createdAt: new Date().toISOString() } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function generateQuiz(req, res) {
  try {
    const subject = typeof req.body?.subject === "string" && req.body.subject.trim() ? req.body.subject.trim() : "General";
    const topic = typeof req.body?.topic === "string" && req.body.topic.trim() ? req.body.topic.trim() : subject;
    const difficulty = typeof req.body?.difficulty === "string" ? req.body.difficulty.trim().toLowerCase() : "medium";
    const count = Math.max(1, Math.min(10, Number(req.body?.count || 5)));

    const systemPrompt = "You create multiple-choice questions for exit exam preparation.";
    const userPrompt = [
      `Subject: ${subject}`,
      `Topic: ${topic}`,
      `Difficulty: ${difficulty}`,
      `Generate ${count} questions.`,
      "Return JSON: { questions: [{ questionText, options: [4], correctAnswer, explanation }] }.",
      "correctAnswer must match one option exactly."
    ].join("\n");

    const ai = await callAI({ systemPrompt, userPrompt, jsonMode: true, maxTokens: 1200 });
    const parsed = extractJsonObject(ai.text);
    const rawQuestions = Array.isArray(parsed?.questions) ? parsed.questions : [];

    const questions = rawQuestions
      .map((item) => ({
        questionText: typeof item?.questionText === "string" ? item.questionText.trim() : "",
        options: Array.isArray(item?.options)
          ? item.options.map((option) => (typeof option === "string" ? option.trim() : "")).filter(Boolean).slice(0, 4)
          : [],
        correctAnswer: typeof item?.correctAnswer === "string" ? item.correctAnswer.trim() : "",
        explanation: typeof item?.explanation === "string" ? item.explanation.trim() : ""
      }))
      .filter((item) => item.questionText && item.options.length === 4 && item.correctAnswer && item.options.includes(item.correctAnswer));

    return res.json({ ok: true, feature: "quiz", data: { questions }, meta: { ...ai.meta, createdAt: new Date().toISOString() } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function explainAnswer(req, res) {
  try {
    const questionText = typeof req.body?.questionText === "string" ? req.body.questionText.trim() : "";
    const selectedAnswer = typeof req.body?.selectedAnswer === "string" ? req.body.selectedAnswer.trim() : "";
    const correctAnswer = typeof req.body?.correctAnswer === "string" ? req.body.correctAnswer.trim() : "";
    const topic = typeof req.body?.topic === "string" && req.body.topic.trim() ? req.body.topic.trim() : "General";

    if (!questionText || !selectedAnswer || !correctAnswer) {
      return res.status(400).json({ message: "questionText, selectedAnswer, and correctAnswer are required" });
    }

    const systemPrompt = "You are a supportive tutor. Explain in simple language.";
    const userPrompt = [
      `Topic: ${topic}`,
      `Question: ${questionText}`,
      `Student answer: ${selectedAnswer}`,
      `Correct answer: ${correctAnswer}`,
      "Return JSON with keys: whyCorrect (string), whyStudentAnswer (string), memoryTip (string)."
    ].join("\n\n");

    const ai = await callAI({ systemPrompt, userPrompt, jsonMode: true, maxTokens: 500 });
    const parsed = extractJsonObject(ai.text);

    const data = {
      whyCorrect: typeof parsed?.whyCorrect === "string" ? parsed.whyCorrect : `The correct answer is ${correctAnswer} because it matches the concept in this topic.`,
      whyStudentAnswer: typeof parsed?.whyStudentAnswer === "string" ? parsed.whyStudentAnswer : `Your selected answer (${selectedAnswer}) does not fully match the required concept.`,
      memoryTip: typeof parsed?.memoryTip === "string" ? parsed.memoryTip : "Write one-line summaries after each question to remember key rules."
    };

    return res.json({ ok: true, feature: "explain", data, meta: { ...ai.meta, createdAt: new Date().toISOString() } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function recommendWeakTopics(req, res) {
  try {
    const topicPerformance = normalizeTopicPerformance(req.body?.topicPerformance);
    const weakTopics = topicPerformance
      .filter((item) => item.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 6);

    const systemPrompt = "You are a study coach. Give prioritized actionable recommendations.";
    const userPrompt = [
      "Use this weak topic list to provide action steps.",
      `Weak topics: ${JSON.stringify(weakTopics)}.`,
      "Return JSON with keys: priorities (array of { topic, action, practiceCount })."
    ].join("\n\n");

    const ai = await callAI({ systemPrompt, userPrompt, jsonMode: true, maxTokens: 700 });
    const parsed = extractJsonObject(ai.text);
    const priorities = Array.isArray(parsed?.priorities) ? parsed.priorities : weakTopics.map((item) => ({
      topic: item.topic,
      action: "Review core concepts and solve focused practice questions.",
      practiceCount: item.accuracy < 40 ? 25 : 15
    }));

    return res.json({ ok: true, feature: "recommend", data: { weakTopics, priorities }, meta: { ...ai.meta, createdAt: new Date().toISOString() } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function generateStudyPlan(req, res) {
  try {
    const hoursPerWeek = Math.max(1, Number(req.body?.hoursPerWeek || 8));
    const examDate = typeof req.body?.examDate === "string" ? req.body.examDate : "";
    const weakTopics = Array.isArray(req.body?.weakTopics)
      ? req.body.weakTopics.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
      : [];
    const preferredStudyTime = typeof req.body?.preferredStudyTime === "string" ? req.body.preferredStudyTime.trim() : "evening";

    const systemPrompt = "You are an exit exam planner. Build practical, realistic weekly plans.";
    const userPrompt = [
      `Hours per week: ${hoursPerWeek}`,
      `Exam date: ${examDate || "Not provided"}`,
      `Weak topics: ${weakTopics.join(", ") || "General revision"}`,
      `Preferred time: ${preferredStudyTime}`,
      "Return JSON with key plan (array of 7 items). Each item: { day, durationMinutes, focus, tasks }"
    ].join("\n\n");

    const ai = await callAI({ systemPrompt, userPrompt, jsonMode: true, maxTokens: 900 });
    const parsed = extractJsonObject(ai.text);
    const plan = Array.isArray(parsed?.plan) ? parsed.plan.slice(0, 7) : [];

    return res.json({ ok: true, feature: "study-plan", data: { plan }, meta: { ...ai.meta, createdAt: new Date().toISOString() } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function dashboardRecommendation(req, res) {
  try {
    const requestedStudentId = req.body.studentId || req.user.id;
    const studentId = req.user.role === "student" ? req.user.id : requestedStudentId;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const subjectScores = req.body.subjectScores && Object.keys(req.body.subjectScores).length > 0
      ? req.body.subjectScores
      : toAverageMap(student.activityLog || []);

    const weakSubjects = weakSubjectsFromScores(subjectScores);
    const recommendation = await generateRecommendation(subjectScores, weakSubjects);

    const analyticsRecord = await AIAnalytics.findOneAndUpdate(
      { studentId: student._id },
      {
        $set: {
          weakSubjects,
          aiRecommendations: [recommendation],
          lastGenerated: new Date()
        }
      },
      { upsert: true, new: true }
    );

    return res.json({
      studentId: student._id,
      weakSubjects,
      subjectScores,
      recommendation,
      analyticsId: analyticsRecord._id
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function addActivity(req, res) {
  try {
    const studentId = req.user.role === "student" ? req.user.id : req.body.studentId;
    const { subject, topic, score, total, activityType } = req.body;

    if (!studentId || !subject) {
      return res.status(400).json({ message: "studentId and subject are required" });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.activityLog.push({
      subject,
      topic: typeof topic === "string" && topic.trim() ? topic.trim() : subject,
      score: Number(score || 0),
      total: Number(total || 5),
      activityType: activityType || "practice"
    });

    await student.save();
    return res.status(201).json({ message: "Activity added" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  dashboardRecommendation,
  addActivity,
  summarizeNotes,
  generateQuiz,
  explainAnswer,
  recommendWeakTopics,
  generateStudyPlan
};
