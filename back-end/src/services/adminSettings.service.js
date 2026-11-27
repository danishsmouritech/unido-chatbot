import { firestore } from "../config/db.js";

const SETTINGS = firestore.collection("adminSettings").doc("global");
const DEFAULT_SETTINGS = {
  key: "global",
  chatbotEnabled: true,
  systemPrompt: "",
  lastScrapeAt: null
};

export async function getAdminSettingsRecord() {
  await firestore.runTransaction(async transaction => {
    const snapshot = await transaction.get(SETTINGS);
    if (!snapshot.exists) {
      transaction.create(SETTINGS, { ...DEFAULT_SETTINGS, createdAt: new Date(), updatedAt: new Date() });
    }
  });
  const snapshot = await SETTINGS.get();
  const settings = snapshot.data();
  if (settings.lastScrapeAt?.toDate) settings.lastScrapeAt = settings.lastScrapeAt.toDate();
  return settings;
}

export async function updateAdminSettingsRecord(patch = {}) {
  const update = { updatedAt: new Date() };
  if (typeof patch.systemPrompt === "string") update.systemPrompt = patch.systemPrompt.trim();
  if (typeof patch.chatbotEnabled === "boolean") update.chatbotEnabled = patch.chatbotEnabled;
  if (patch.lastScrapeAt instanceof Date) update.lastScrapeAt = patch.lastScrapeAt;
  await getAdminSettingsRecord();
  await SETTINGS.set(update, { merge: true });
  const snapshot = await SETTINGS.get();
  const settings = snapshot.data();
  if (settings.lastScrapeAt?.toDate) settings.lastScrapeAt = settings.lastScrapeAt.toDate();
  return settings;
}
