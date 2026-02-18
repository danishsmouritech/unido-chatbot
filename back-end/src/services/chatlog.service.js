import ChatLog from "../models/chatLog.model.js";

export async function createChatLog(payload) {
  try {
    await ChatLog.create(payload);
  } catch (error) {
    console.error("Failed to create chat log:", error.message);
  }
}
