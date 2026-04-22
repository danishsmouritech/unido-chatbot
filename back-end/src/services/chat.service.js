import ChatSession from "../models/chatSession.model.js";
import crypto from "crypto";
import { logger } from "../utils/logger.js";

export async function ensureSession(sessionId) {
  if (!sessionId) {
    throw new Error("sessionId is required");
  }

  const session = await ChatSession.findOneAndUpdate(
    { sessionId },
    {
      $setOnInsert: {
        sessionId,
        messages: []
      }
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true
    }
  ).lean();

  return session;
}

export async function createSession() {
  const sessionId = crypto.randomUUID();
  try {
    await ensureSession(sessionId);
    return sessionId;
  } catch (error) {
    logger.error("Error creating session:", error.message);
    throw error;
  }
}

export async function addMessage(sessionId, message) {
  try {
    await ensureSession(sessionId);

    const result = await ChatSession.updateOne(
      { sessionId },
      { $push: { messages: message } }
    );
    return result;
  } catch (error) {
    logger.error("Error adding message:", error.message);
    throw error;
  }
}

export async function getHistory(sessionId) {
  const session = await ChatSession.findOne(
    { sessionId },
    { _id: 0, messages: 1 }
  );
  if (!session) return null;
  return session.messages || [];
}

export async function clearHistory(sessionId) {
  await ChatSession.updateOne(
    { sessionId },
    { $set: { messages: [] } }
  );
}
