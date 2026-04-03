const User = require("../models/User");
const Resource = require("../models/Resource");
const Exam = require("../models/Exam");
const Question = require("../models/Question");

async function getOverview(_req, res) {
  try {
    const [totalUsers, activeUsers, suspendedUsers, resourcesCount, questionsCount, examsCount, recentSignups, topResources, weakTopics] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isSuspended: false }),
      User.countDocuments({ isSuspended: true }),
      Resource.countDocuments(),
      Question.countDocuments(),
      Exam.countDocuments(),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      Resource.find().sort({ downloads: -1 }).limit(5).select("title downloads course department year"),
      User.aggregate([
        { $unwind: "$activityLog" },
        {
          $group: {
            _id: "$activityLog.subject",
            averageScore: { $avg: "$activityLog.score" },
            attempts: { $sum: 1 }
          }
        },
        { $sort: { averageScore: 1, attempts: -1 } },
        { $limit: 5 }
      ])
    ]);

    return res.json({
      totalUsers,
      activeUsers,
      suspendedUsers,
      recentSignups,
      resourcesCount,
      questionsCount,
      examsCount,
      topResources: topResources.map((resource) => ({
        id: resource._id,
        title: resource.title,
        downloads: resource.downloads || 0,
        course: resource.course,
        department: resource.department,
        year: resource.year
      })),
      weakTopics: weakTopics
        .filter((item) => item._id)
        .map((item) => ({
          subject: item._id,
          averageScore: Number.isFinite(item.averageScore) ? Number(item.averageScore.toFixed(2)) : 0,
          attempts: item.attempts
        }))
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function listUsers(_req, res) {
  try {
    const users = await User.find({}, "name email role isSuspended activityLog createdAt").sort({ createdAt: -1 });

    const normalized = users.map((user) => {
      const activityLog = Array.isArray(user.activityLog) ? user.activityLog : [];
      const totalScore = activityLog.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
      const totalCount = activityLog.length;
      const average = totalCount > 0 ? Math.round((totalScore / (totalCount * 5)) * 100) : 0;
      const lastActivity = totalCount > 0 ? activityLog[totalCount - 1].createdAt : user.createdAt;

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuspended: Boolean(user.isSuspended),
        status: user.isSuspended ? "Suspended" : "Active",
        progress: `${average}%`,
        activityCount: totalCount,
        lastActivity
      };
    });

    return res.json(normalized);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["student", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be either student or admin." });
    }

    const updated = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      isSuspended: Boolean(updated.isSuspended)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function updateUserSuspension(req, res) {
  try {
    const { id } = req.params;
    const { isSuspended } = req.body;

    if (typeof isSuspended !== "boolean") {
      return res.status(400).json({ message: "isSuspended must be a boolean value." });
    }

    const updated = await User.findByIdAndUpdate(id, { isSuspended }, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      isSuspended: Boolean(updated.isSuspended)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getOverview,
  listUsers,
  updateUserRole,
  updateUserSuspension,
  deleteUser
};
