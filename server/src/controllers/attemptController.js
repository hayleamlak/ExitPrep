const mongoose = require("mongoose");
const Attempt = require("../models/Attempt");

function normalizeString(value, fallback = "General") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function toPercent(numerator, denominator) {
  if (!denominator) {
    return 0;
  }

  return Number(((numerator / denominator) * 100).toFixed(2));
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

async function createAttempt(req, res) {
  try {
    const resolvedUserId = req.user.role === "student" ? req.user.id : req.body.userId || req.user.id;
    const course = normalizeString(req.body.course, "");
    const topic = normalizeString(req.body.topic, "");

    if (!course || !topic || typeof req.body.isCorrect !== "boolean") {
      return res.status(400).json({
        message: "course, topic and isCorrect(boolean) are required"
      });
    }

    const created = await Attempt.create({
      userId: resolvedUserId,
      course,
      topic,
      isCorrect: Boolean(req.body.isCorrect)
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function createAttemptsBulk(req, res) {
  try {
    const resolvedUserId = req.user.role === "student" ? req.user.id : req.body.userId || req.user.id;
    const items = Array.isArray(req.body?.attempts) ? req.body.attempts : [];

    if (!items.length) {
      return res.status(400).json({ message: "attempts array is required" });
    }

    const normalized = [];
    const invalidItems = [];

    items.forEach((item, index) => {
      const course = normalizeString(item?.course, "");
      const topic = normalizeString(item?.topic, "");
      const isCorrect = item?.isCorrect;

      if (!course || !topic || typeof isCorrect !== "boolean") {
        invalidItems.push({ index, message: "course, topic and isCorrect(boolean) are required" });
        return;
      }

      normalized.push({
        userId: resolvedUserId,
        course,
        topic,
        isCorrect
      });
    });

    if (invalidItems.length > 0) {
      return res.status(400).json({ message: "Some attempts are invalid", invalidItems });
    }

    const created = await Attempt.insertMany(normalized);
    return res.status(201).json({ insertedCount: created.length });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function listCourses(req, res) {
  try {
    const targetUserId = req.user.role === "student" ? req.user.id : req.query.userId || req.user.id;

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const courses = await Attempt.distinct("course", { userId: targetUserId });
    return res.json(courses.sort((a, b) => a.localeCompare(b)));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getInsightsByCourse(req, res) {
  try {
    const targetUserId = req.user.role === "student" ? req.user.id : req.query.userId || req.user.id;
    const selectedCourse = typeof req.query.course === "string" ? req.query.course.trim() : "";

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const match = { userId: new mongoose.Types.ObjectId(targetUserId) };
    if (selectedCourse) {
      match.course = selectedCourse;
    }

    const [overallStats, topicStats, recentAttempts] = await Promise.all([
      Attempt.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            correctAnswers: {
              $sum: {
                $cond: [{ $eq: ["$isCorrect", true] }, 1, 0]
              }
            }
          }
        }
      ]),
      Attempt.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$topic",
            attempts: { $sum: 1 },
            correctAnswers: {
              $sum: {
                $cond: [{ $eq: ["$isCorrect", true] }, 1, 0]
              }
            }
          }
        },
        { $sort: { attempts: -1, _id: 1 } }
      ]),
      Attempt.find(match)
        .sort({ createdAt: -1 })
        .limit(10)
        .select("course topic isCorrect createdAt")
        .lean()
    ]);

    const base = overallStats[0] || { totalAttempts: 0, correctAnswers: 0 };
    const accuracyPercentage = toPercent(base.correctAnswers, base.totalAttempts);
    const averageScore = accuracyPercentage;

    const groupedByTopic = topicStats.map((item) => {
      const topicAccuracy = toPercent(item.correctAnswers, item.attempts);
      return {
        topic: item._id || "General",
        attempts: item.attempts,
        correctAnswers: item.correctAnswers,
        accuracyPercentage: topicAccuracy
      };
    });

    const weakAreas = groupedByTopic
      .slice()
      .sort((a, b) => a.accuracyPercentage - b.accuracyPercentage || b.attempts - a.attempts)
      .slice(0, 5);

    return res.json({
      filter: {
        userId: targetUserId,
        course: selectedCourse || "all"
      },
      overall: {
        totalAttempts: base.totalAttempts,
        correctAnswers: base.correctAnswers,
        accuracyPercentage,
        averageScore
      },
      groupedByTopic,
      weakAreas,
      recentAttempts
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createAttempt,
  createAttemptsBulk,
  listCourses,
  getInsightsByCourse
};