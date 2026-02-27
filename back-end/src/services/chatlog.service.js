import ChatLog from "../models/chatLog.model.js";
import { emitRealtime } from "../realtime/socket.js";

export async function createChatLog(payload) {
  try {
    await ChatLog.create(payload);
    emitRealtime("analytics:updated", { source: "chatlog" });
  } catch (error) {
    console.error("Failed to create chat log:", error.message);
  }
}
