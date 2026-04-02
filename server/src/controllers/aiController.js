const User = require("../models/User");
const AIAnalytics = require("../models/AIAnalytics");
const { toAverageMap, weakSubjectsFromScores } = require("../utils/analytics");
const { generateRecommendation } = require("../services/huggingFace");

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
    const { subject, score, total, activityType } = req.body;

    if (!studentId || !subject) {
      return res.status(400).json({ message: "studentId and subject are required" });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.activityLog.push({
      subject,
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
  addActivity
};
