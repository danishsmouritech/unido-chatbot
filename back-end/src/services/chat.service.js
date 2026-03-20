import ChatSession from "../models/chatSession.model.js";
import crypto from "crypto";
import { logger } from "../utils/logger.js";
export async function createSession() {
  const sessionId = crypto.randomUUID();
  try {
    const session = await ChatSession.create({
      sessionId,
      messages: []
    });
    // Verify the session was saved before returning
    const verifySession = await ChatSession.findOne({ sessionId });
    if (!verifySession) {
      throw new Error("Session creation failed - verification check failed");
    }
    
    return sessionId;
  } catch (error) {
    logger.error("Error creating session:", error.message);
    throw error;
  }
}

export async function addMessage(sessionId, message) {
  try {
    const result = await ChatSession.updateOne(
      { sessionId },
      { $push: { messages: message } }
    );
    if (result.matchedCount === 0) {
      throw new Error(`Session ${sessionId} not found`);
    }
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
