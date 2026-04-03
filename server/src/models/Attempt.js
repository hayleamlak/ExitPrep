const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    course: { type: String, required: true, trim: true, index: true },
    topic: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, required: true }
  },
  { timestamps: true }
);

attemptSchema.index({ userId: 1, course: 1, createdAt: -1 });

module.exports = mongoose.model("Attempt", attemptSchema);