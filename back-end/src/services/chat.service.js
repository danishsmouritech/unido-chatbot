import ChatSession from "../models/chatSession.model.js";
import crypto from "crypto";

export async function createSession() {
  const sessionId = crypto.randomUUID();

  await ChatSession.create({
    sessionId,
    messages: []
  });
  return sessionId;
}

export async function addMessage(sessionId, message) {
  await ChatSession.updateOne(
    { sessionId },
    { $push: { messages: message } }
  );
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
