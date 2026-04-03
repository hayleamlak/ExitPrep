const Question = require("../models/Question");

function normalizeQuestionPayload(item, index) {
  const courseName = typeof item?.courseName === "string" ? item.courseName.trim() : "";
  const subject = typeof item?.subject === "string" ? item.subject.trim() : courseName;
  const questionText = typeof item?.questionText === "string" ? item.questionText.trim() : "";
  const explanation = typeof item?.explanation === "string" ? item.explanation.trim() : "";
  const correctAnswer = typeof item?.correctAnswer === "string" ? item.correctAnswer.trim() : "";
  const options = Array.isArray(item?.options)
    ? item.options.map((option) => (typeof option === "string" ? option.trim() : "")).filter(Boolean)
    : [];

  const errors = [];

  if (!subject) {
    errors.push("courseName/subject is required");
  }
  if (!questionText) {
    errors.push("questionText is required");
  }
  if (options.length !== 4) {
    errors.push("options must contain exactly 4 items");
  }
  if (!correctAnswer) {
    errors.push("correctAnswer is required");
  }
  if (!explanation) {
    errors.push("explanation is required");
  }

  return {
    index,
    errors,
    payload: {
      subject,
      questionText,
      options,
      correctAnswer,
      explanation,
      difficulty: typeof item?.difficulty === "string" ? item.difficulty : "medium"
    }
  };
}

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
    const subject = typeof payload?.subject === "string" ? payload.subject.trim() : typeof payload?.courseName === "string" ? payload.courseName.trim() : "";

    const question = await Question.create({
      subject,
      questionText: payload.questionText,
      options: payload.options,
      correctAnswer: payload.correctAnswer,
      explanation: payload.explanation,
      difficulty: payload.difficulty || "medium"
    });
    return res.status(201).json(question);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function bulkCreateQuestions(req, res) {
  try {
    const items = Array.isArray(req.body) ? req.body : Array.isArray(req.body?.questions) ? req.body.questions : [];

    if (!items.length) {
      return res.status(400).json({ message: "Send a JSON array of questions." });
    }

    const normalized = items.map((item, index) => normalizeQuestionPayload(item, index));
    const invalidItems = normalized.filter((item) => item.errors.length > 0);

    if (invalidItems.length > 0) {
      return res.status(400).json({
        message: "Some questions are invalid.",
        invalidItems: invalidItems.map((item) => ({ index: item.index, errors: item.errors }))
      });
    }

    const createdQuestions = await Question.insertMany(normalized.map((item) => item.payload));

    return res.status(201).json({
      message: "Questions imported successfully.",
      importedCount: createdQuestions.length,
      questions: createdQuestions
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

module.exports = {
  listQuestions,
  createQuestion,
  bulkCreateQuestions
};
