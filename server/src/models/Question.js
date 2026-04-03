const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    subject: { type: String, required: true },
    category: {
      type: String,
      enum: ["simulation", "past", "custom"],
      default: "custom",
      index: true
    },
    sourceType: {
      type: String,
      enum: ["simulation", "past", "custom"],
      default: "custom"
    },
    examYear: { type: Number },
    explanation: { type: String },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
