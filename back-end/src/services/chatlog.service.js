import { firestore } from "../config/db.js";
import { emitRealtime } from "../realtime/socket.js";
import { logger } from "../utils/logger.js";

export async function createChatLog(payload) {
  try {
    const now = new Date();
    await firestore.collection("chatLogs").add({ ...payload, createdAt: now, updatedAt: now });
    emitRealtime("analytics:updated", { source: "chatlog" });
    emitRealtime("information:updated", { source: "chatlog" });
  } catch (error) {
    logger.error("Failed to create chat log:", error.message);
  }
}
