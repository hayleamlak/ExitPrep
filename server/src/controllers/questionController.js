const Question = require("../models/Question");

async function listQuestions(req, res) {
  try {
    const query = {};

    if (req.query.subject) {
      query.subject = req.query.subject;
    }

    const questions = await Question.find(query).sort({ createdAt: -1 });
    return res.json(questions);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function createQuestion(req, res) {
  try {
    const payload = req.body;
    const question = await Question.create(payload);
    return res.status(201).json(question);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

module.exports = {
  listQuestions,
  createQuestion
};
