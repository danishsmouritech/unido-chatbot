import { firestore } from "../config/db.js";
import {
  getAdminSettingsRecord,
  updateAdminSettingsRecord
} from "../services/adminSettings.service.js";
import { getScrapeStatus, triggerScrape } from "../services/scrape.service.js";
import { emitRealtime } from "../realtime/socket.js";
import { logger } from "../utils/logger.js";

function dateBounds({ fromDate, toDate, startDate, endDate } = {}) {
  const from = fromDate || startDate;
  const to = toDate || endDate;
  return {
    start: from ? new Date(`${from}T00:00:00.000`) : null,
    end: to ? new Date(`${to}T23:59:59.999`) : null
  };
}

async function listDated(collection, bounds) {
  let query = firestore.collection(collection);
  if (bounds.start) query = query.where("createdAt", ">=", bounds.start);
  if (bounds.end) query = query.where("createdAt", "<=", bounds.end);
  const snapshot = await query.get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      _id: doc.id,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
    };
  });
}

export async function getAdminAnalytics(req, res) {
  try {
    const bounds = dateBounds(req.query);
    const [sessions, messageSnapshot, logs] = await Promise.all([
      listDated("chatSessions", bounds),
      (async () => {
        let query = firestore.collectionGroup("messages");
        if (bounds.start) query = query.where("createdAt", ">=", bounds.start);
        if (bounds.end) query = query.where("createdAt", "<=", bounds.end);
        return query.get();
      })(),
      listDated("chatLogs", bounds)
    ]);
    const roles = { user: 0, assistant: 0 };
    for (const doc of messageSnapshot.docs) {
      const role = doc.data().role;
      if (Object.hasOwn(roles, role)) roles[role] += 1;
    }
    const ips = new Set(logs.map(log => log.requestMeta?.ip).filter(Boolean));
    const errors = logs.filter(log => log.status === "error").length;
    const avgResponseMs = logs.length
      ? Math.round(logs.reduce((sum, log) => sum + (log.timingMs?.total || 0), 0) / logs.length)
      : 0;
    res.json({
      conversations: sessions.length,
      messages: roles.user + roles.assistant,
      userMessages: roles.user,
      assistantMessages: roles.assistant,
      uniqueUsers: ips.size,
      avgResponseMs,
      errors
    });
  } catch (error) {
    logger.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to load analytics" });
  }
}

export const getInformation = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim().toLowerCase();
    const pageNumber = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);
    const logs = (await listDated("chatLogs", dateBounds(req.query)))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter(log => !search || [log.sessionId, log.question, log.answer, log.requestMeta?.ip, log.status,
        new Date(log.createdAt).toLocaleDateString("en-GB")].some(value => String(value || "").toLowerCase().includes(search)));
    const total = logs.length;
    const totalPages = Math.max(Math.ceil(total / limitNumber), 1);
    res.json({
      logs: logs.slice((pageNumber - 1) * limitNumber, pageNumber * limitNumber),
      pagination: { page: pageNumber, limit: limitNumber, total, totalPages,
        hasNext: pageNumber < totalPages, hasPrev: pageNumber > 1 }
    });
  } catch (error) {
    logger.error("getInformation error:", error);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};

export async function getAdminSettings(_req, res) {
  try {
    const settings = await getAdminSettingsRecord();
    res.json({ systemPrompt: settings.systemPrompt, chatbotEnabled: settings.chatbotEnabled, lastScrapeAt: settings.lastScrapeAt });
  } catch (error) {
    logger.error("Get settings error:", error);
    res.status(500).json({ error: "Failed to load settings" });
  }
}

export async function updateAdminSettings(req, res) {
  try {
    const { systemPrompt, chatbotEnabled } = req.body || {};
    const updated = await updateAdminSettingsRecord({ systemPrompt, chatbotEnabled });
    res.json({ success: true, settings: {
      systemPrompt: updated.systemPrompt, chatbotEnabled: updated.chatbotEnabled, lastScrapeAt: updated.lastScrapeAt
    } });
    emitRealtime("chatbot:visibilityChanged", { chatbotEnabled: updated.chatbotEnabled });
    emitRealtime("analytics:updated", { source: "settings" });
  } catch (error) {
    logger.error("Update settings error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
}

export async function triggerAdminScrape(_req, res) {
  res.json(await triggerScrape());
}

export async function getAdminScrapeStatus(_req, res) {
  res.json(getScrapeStatus());
}

export async function exportChatLogsCsv(req, res) {
  const limit = Math.min(Number(req.query.limit || 5000), 10000);
  const bounds = dateBounds({ startDate: req.query.startDate, endDate: req.query.endDate });
  const logs = (await listDated("chatLogs", bounds))
    .filter(log => req.query.type !== "conversations" || ["success", "fallback"].includes(log.status))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
  const header = ["createdAt", "sessionId", "status", "question", "answer", "sourceCount", "responseMs", "ip"];
  const rows = logs.map(log => [
    log.createdAt?.toDate?.().toISOString?.() || new Date(log.createdAt).toISOString(),
    log.sessionId, log.status, log.question, log.answer, log.sources?.length || 0,
    log.timingMs?.total || 0, log.requestMeta?.ip || ""
  ]);
  const csv = [header.join(","), ...rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const fileName = `chat-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.send(csv);
}
