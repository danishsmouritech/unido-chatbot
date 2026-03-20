import ChatLog from "../models/chatLog.model.js";
import { emitRealtime } from "../realtime/socket.js";
import { logger } from "../utils/logger.js";
export async function createChatLog(payload) {
  try {
    await ChatLog.create(payload);
    emitRealtime("analytics:updated", { source: "chatlog" });
    emitRealtime("information:updated", { source: "chatlog" });
  } catch (error) {
    logger.error("Failed to create chat log:", error.message);
  }
}
