const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    course: { type: String, required: true },
    department: { type: String, required: true },
    year: { type: String, required: true },
    fileUrl: { type: String, required: true },
    rating: { type: Number, min: 0, max: 5, default: 4.6 },
    downloads: { type: Number, min: 0, default: 0 },
    tags: [{ type: String }],
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", resourceSchema);
