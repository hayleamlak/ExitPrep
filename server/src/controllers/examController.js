const Exam = require("../models/Exam");

async function listExams(_req, res) {
  try {
    const exams = await Exam.find().populate("questions").sort({ createdAt: -1 });
    return res.json(exams);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function createExam(req, res) {
  try {
    const exam = await Exam.create(req.body);
    return res.status(201).json(exam);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

module.exports = {
  listExams,
  createExam
};
