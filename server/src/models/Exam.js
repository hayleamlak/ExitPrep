const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    examName: { type: String, required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    duration: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);
