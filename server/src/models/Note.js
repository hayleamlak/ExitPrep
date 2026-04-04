const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource" },
    content: { type: String, required: true },
    generatedBy: { type: String, default: "ai" }
  },
  { timestamps: true }
);

noteSchema.index({ course: 1 }, { unique: true });

module.exports = mongoose.model("Note", noteSchema);
