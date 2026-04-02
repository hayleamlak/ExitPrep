const mongoose = require("mongoose");

const aiAnalyticsSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    weakSubjects: [{ type: String }],
    aiRecommendations: [{ type: String }],
    lastGenerated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIAnalytics", aiAnalyticsSchema);
