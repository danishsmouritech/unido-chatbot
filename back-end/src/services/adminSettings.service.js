import AdminSetting from "../models/adminSettings.model.js";

const GLOBAL_KEY = "global";
export async function getAdminSettingsRecord() {
  const existing = await AdminSetting.findOne({ key: GLOBAL_KEY });
  if (existing) return existing;
  return AdminSetting.create(DEFAULT_SETTINGS);
}

export async function updateAdminSettingsRecord(patch = {}) {
  const update = {};

  if (typeof patch.systemPrompt === "string") {
    update.systemPrompt = patch.systemPrompt.trim();
  }
  if (typeof patch.chatbotEnabled === "boolean") {
    update.chatbotEnabled = patch.chatbotEnabled;
  }
  if (patch.lastScrapeAt instanceof Date) {
    update.lastScrapeAt = patch.lastScrapeAt;
  }

  return AdminSetting.findOneAndUpdate(
    { key: GLOBAL_KEY },
    { $set: update, $setOnInsert:  { key: GLOBAL_KEY }  },
    { upsert: true,returnDocument: "after"}
  );
}
