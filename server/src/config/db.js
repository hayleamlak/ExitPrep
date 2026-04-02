const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/exitprep";

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });

    console.log(`MongoDB connected: ${mongoUri}`);
  } catch (error) {
    console.error(`MongoDB connection error for ${mongoUri}:`, error.message);
    throw error;
  }
}

module.exports = connectDB;
