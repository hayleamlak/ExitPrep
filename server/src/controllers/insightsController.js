const User = require("../models/User");
const Question = require("../models/Question");

function round(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function normalizeLabel(value, fallback = "General") {
  if (!value || typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized ? normalized : fallback;
}

function sessionAccuracy(item) {
  const score = Number(item?.score || 0);
  const total = Number(item?.total || 0);

  if (total <= 0) {
    return 0;
  }

  return (score / total) * 100;
}

function buildBreakdown(activityLog, keySelector) {
  const grouped = new Map();

  activityLog.forEach((item) => {
    const label = normalizeLabel(keySelector(item));
    const current = grouped.get(label) || { label, attempts: 0, correct: 0, total: 0, accuracySum: 0 };
    const accuracy = sessionAccuracy(item);

    current.attempts += 1;
    current.correct += Number(item?.score || 0);
    current.total += Number(item?.total || 0);
    current.accuracySum += accuracy;
    grouped.set(label, current);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      label: item.label,
      attempts: item.attempts,
      averageScore: item.attempts > 0 ? round(item.accuracySum / item.attempts) : 0,
      accuracy: item.total > 0 ? round((item.correct / item.total) * 100) : 0,
      totalCorrect: round(item.correct, 0),
      totalQuestions: round(item.total, 0)
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts);
}

function buildInsightsPayload(user, questionCount) {
  const activityLog = Array.isArray(user.activityLog) ? [...user.activityLog] : [];
  const recentSessions = activityLog
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 8)
    .map((item) => ({
      subject: normalizeLabel(item.subject),
      topic: normalizeLabel(item.topic || item.subject),
      score: Number(item.score || 0),
      total: Number(item.total || 0),
      accuracy: round(sessionAccuracy(item)),
      activityType: item.activityType || "practice",
      createdAt: item.createdAt
    }));

  const totalAttempts = activityLog.length;
  const totalCorrect = activityLog.reduce((sum, item) => sum + Number(item.score || 0), 0);
  const totalQuestions = activityLog.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const accuracy = totalQuestions > 0 ? round((totalCorrect / totalQuestions) * 100) : 0;
  const averageScore = totalAttempts > 0 ? round(activityLog.reduce((sum, item) => sum + sessionAccuracy(item), 0) / totalAttempts) : 0;
  const progressPercentage = questionCount > 0 ? round(Math.min(100, (totalQuestions / questionCount) * 100)) : 0;
  const consistency = Math.min(100, totalAttempts * 10);
  const examReadiness = round(Math.max(0, Math.min(100, accuracy * 0.5 + progressPercentage * 0.3 + consistency * 0.2)));

  const subjectBreakdown = buildBreakdown(activityLog, (item) => item.subject);
  const topicBreakdown = buildBreakdown(activityLog, (item) => item.topic || item.subject).slice(0, 8);
  const weakAreas = [...subjectBreakdown, ...topicBreakdown]
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, 5)
    .map((item) => ({
      label: item.label,
      attempts: item.attempts,
      accuracy: item.accuracy,
      averageScore: item.averageScore
    }));

  return {
    student: {
      id: user._id,
      name: user.name,
      email: user.email
    },
    summary: {
      averageScore,
      accuracy,
      totalAttempts,
      progressPercentage,
      examReadiness
    },
    subjectBreakdown,
    topicBreakdown,
    weakAreas,
    recentSessions
  };
}

async function getMyInsights(req, res) {
  try {
    const student = await User.findById(req.user.id).select("name email activityLog");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const questionCount = await Question.countDocuments();
    return res.json(buildInsightsPayload(student, questionCount));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getMyInsights
};