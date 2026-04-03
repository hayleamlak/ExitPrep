const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userActivitySchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    score: { type: Number, min: 0, max: 5 },
    total: { type: Number, default: 5 },
    activityType: {
      type: String,
      enum: ["study", "practice", "exam"],
      default: "practice"
    },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    isSuspended: { type: Boolean, default: false },
    activityLog: [userActivitySchema]
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
