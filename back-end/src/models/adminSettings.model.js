import mongoose from "mongoose";

const adminSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "global",
      unique: true,
      index: true
    },
    systemPrompt: {
      type: String,
      default:
        "You are a UNIDO Careers Assistant.\nAnswer ONLY from provided CONTEXT.\nIf insufficient info, say you don't have enough information."
    },
    chatbotEnabled: {
      type: Boolean,
      default: true
    },
    lastScrapeAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const AdminSetting = mongoose.model("AdminSetting", adminSettingsSchema);

export default AdminSetting;
