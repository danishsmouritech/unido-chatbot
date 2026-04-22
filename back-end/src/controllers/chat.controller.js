import { runRAG } from "../services/rag.service.js";
import { isBlockedQuery, buildBlockedAnswer } from "../services/guard.service.js";
import {
  addMessage,
  ensureSession,
  getHistory,
  createSession
} from "../services/chat.service.js";
import { createChatLog } from "../services/chatlog.service.js";
import { getAdminSettingsRecord } from "../services/adminSettings.service.js";
import { emitRealtime } from "../realtime/socket.js";
import { logger } from "../utils/logger.js";
function getClientIp(req) {
  let ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "";

  // Convert IPv6 localhost
  if (ip === "::1") return "127.0.0.1";

  // Convert IPv6 mapped IPv4
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
}
//Create Session
export const createChatSession = async (req, res) => {
  logger.log("Creating new chat session");
  try {
    const settings = await getAdminSettingsRecord();
    if (!settings.chatbotEnabled) {
      return res.status(503).json({
        error: "Chatbot is currently disabled"
      });
    }

    const sessionId = await createSession();
    logger.log("Session created successfully, returning:", sessionId);
    emitRealtime("analytics:updated", { source: "session" });
    res.status(201).json({ success: true, sessionId });
  } catch (error) {
    logger.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create chat session" });
  }
};

//Ask Question
export const askQuestion = async (req, res) => {
  const startedAt = Date.now();
  try {
    const { sessionId, question } = req.body;
    logger.log("Extracted sessionId and question:", { sessionId, question });
    const userAgent = req.get("user-agent") || null;
    const ip = getClientIp(req)|| null;
    const settings = await getAdminSettingsRecord();

    if (!settings.chatbotEnabled) {
      return res.status(503).json({
        error: "Chatbot is currently disabled"
      });
    }

    await ensureSession(sessionId);

    if (isBlockedQuery(question)) {
      const blockedAnswer = buildBlockedAnswer();

      await addMessage(sessionId, { role: "user", content: question });
      await addMessage(sessionId, { role: "assistant", content: blockedAnswer });
      await createChatLog({
        sessionId,
        question,
        answer: blockedAnswer,
        status: "fallback",
        sources: [],
        requestMeta: { userAgent, ip },
        timingMs: { total: Date.now() - startedAt }
      });

      return res.json({
        answer: blockedAnswer,
        sources: []
      });
    }

    const history = (await getHistory(sessionId)) || [];
    await addMessage(sessionId, { role: "user", content: question });

    const { answer, sources } = await runRAG(question, history);

    await addMessage(sessionId, { role: "assistant", content: answer });
    await createChatLog({
      sessionId,
      question,
      answer,
      status: sources?.length ? "success" : "fallback",
      sources: (sources || []).map((source) => ({
        id: source?.id || null,
        score: source?.score || null,
        metadata: source?.metadata || {}
      })),
      retrieval: {
        totalRetrieved: sources?.length || 0,
        relevantRetrieved: sources?.length || 0,
        minRelevanceScore: Number(process.env.RAG_MIN_SCORE || 0.75)
      },
      model: {
        chatDeployment: process.env.AZURE_OPENAI_DEPLOYMENT || null,
        embeddingDeployment: process.env.AZURE_EMBEDDING_DEPLOYMENT || null
      },
      requestMeta: { userAgent, ip },
      timingMs: { total: Date.now() - startedAt }
    });

    res.json({ answer, sources });

  } catch (error) {
    logger.error(error);
    const { sessionId, question } = req.body || {};
    if (sessionId && question) {
      await createChatLog({
        sessionId,
        question,
        answer: "Error processing question",
        status: "error",
        sources: [],
        requestMeta: {
          userAgent: req.get("user-agent") || null,
          ip: getClientIp(req) || null
        },
        error: {
          message: error?.message || "Unknown error",
          stack: error?.stack || null
        },
        timingMs: { total: Date.now() - startedAt }
      });
    }
    res.status(500).json({ error: "Failed to process question" });
  }
};

export const getChatVisibility = async (_req, res) => {
  const settings = await getAdminSettingsRecord();
  res.json({
    chatbotEnabled: settings.chatbotEnabled
  });
};
