import { firestore } from "../config/db.js";
import crypto from "crypto";
import { logger } from "../utils/logger.js";

const sessions = firestore.collection("chatSessions");

export async function ensureSession(sessionId) {
  if (!sessionId) throw new Error("sessionId is required");
  const ref = sessions.doc(sessionId);
  await firestore.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) transaction.create(ref, { sessionId, messages: [], createdAt: new Date(), updatedAt: new Date() });
  });
  const result = await ref.get();
  return result.data();
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
  await ensureSession(sessionId);
  const sessionRef = sessions.doc(sessionId);
  await sessionRef.collection("messages").add({ ...message, createdAt: new Date() });
  await sessionRef.update({ updatedAt: new Date() });
}

export async function getHistory(sessionId) {
  const session = await sessions.doc(sessionId).get();
  if (!session.exists) return null;
  const snapshot = await sessions.doc(sessionId).collection("messages").orderBy("createdAt", "asc").get();
  return snapshot.docs.map(doc => doc.data());
}

export async function clearHistory(sessionId) {
  await ensureSession(sessionId);
  const messages = await sessions.doc(sessionId).collection("messages").get();
  for (let offset = 0; offset < messages.docs.length; offset += 450) {
    const batch = firestore.batch();
    messages.docs.slice(offset, offset + 450).forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
  await sessions.doc(sessionId).update({ updatedAt: new Date() });
}
