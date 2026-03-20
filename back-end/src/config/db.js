import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "../utils/logger.js";
dotenv.config();
export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.log("MongoDB connected");
  } catch (err) {
    logger.error("MongoDB connection failed", err);
    process.exit(1);
  }
}
