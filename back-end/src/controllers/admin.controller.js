import ChatLog from "../models/chatLog.model.js";
import ChatSession from "../models/chatSession.model.js";
import {
  getAdminSettingsRecord,
  updateAdminSettingsRecord
} from "../services/adminSettings.service.js";
import { getScrapeStatus, triggerScrape } from "../services/scrape.service.js";

function toCsvValue(value) {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/"/g, "\"\"");
  return `"${text}"`;
}

export async function getAdminAnalytics(_req, res) {
  try {
    const conversationsPromise = ChatSession.countDocuments({});

    const roleCountsPromise = ChatSession.aggregate([
      { $unwind: "$messages" },
      {
        $group: {
          _id: "$messages.role",
          count: { $sum: 1 }
        }
      }
    ]);

    const avgResponsePromise = ChatLog.aggregate([
      {
        $group: {
          _id: null,
          avgMs: { $avg: "$timingMs.total" }
        }
      }
    ]);

    const uniqueIpsPromise = ChatLog.distinct(
      "requestMeta.ip",
      { "requestMeta.ip": { $ne: null } }
    );
   const errorCountPromise = ChatLog.countDocuments({ status: "error" });
    const [
      conversations,
      roleCounts,
      avgResponseData,
      uniqueIps,
      errors
    ] = await Promise.all([
      conversationsPromise,
      roleCountsPromise,
      avgResponsePromise,
      uniqueIpsPromise,
      errorCountPromise
    ]);

    const userMessages =
      roleCounts.find(r => r._id === "user")?.count || 0;

    const assistantMessages =
      roleCounts.find(r => r._id === "assistant")?.count || 0;

    res.json({
      conversations,
      messages: userMessages + assistantMessages,
      userMessages,
      assistantMessages,
      uniqueUsers: uniqueIps.length,
      avgResponseMs: Math.round(avgResponseData?.[0]?.avgMs || 0),
      errors
    });

  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      error: "Failed to load analytics"
    });
  }
}


export async function getAdminSettings(_req, res) {
  try {
    const settings = await getAdminSettingsRecord();

    res.json({
      systemPrompt: settings.systemPrompt,
      chatbotEnabled: settings.chatbotEnabled,
      lastScrapeAt: settings.lastScrapeAt
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ error: "Failed to load settings" });
  }
}

export async function updateAdminSettings(req, res) {
  try {
    const { systemPrompt, chatbotEnabled } = req.body || {};

    const updated = await updateAdminSettingsRecord({
      systemPrompt,
      chatbotEnabled
    });

    res.json({
      success: true,
      settings: {
        systemPrompt: updated.systemPrompt,
        chatbotEnabled: updated.chatbotEnabled,
        lastScrapeAt: updated.lastScrapeAt
      }
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
}

export async function triggerAdminScrape(_req, res) {
  const result = await triggerScrape();
  res.json(result);
}

export async function getAdminScrapeStatus(_req, res) {
  res.json(getScrapeStatus());
}

export async function exportChatLogsCsv(req, res) {
  const limit = Math.min(Number(req.query.limit || 1000), 5000);
  const logs = await ChatLog.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const header = [
    "createdAt",
    "sessionId",
    "status",
    "question",
    "answer",
    "sourceCount",
    "responseMs",
    "ip"
  ];

  const rows = logs.map((log) => [
    toCsvValue(log.createdAt?.toISOString?.() || ""),
    toCsvValue(log.sessionId),
    toCsvValue(log.status),
    toCsvValue(log.question),
    toCsvValue(log.answer),
    toCsvValue(log.sources?.length || 0),
    toCsvValue(log.timingMs?.total || 0),
    toCsvValue(log.requestMeta?.ip || "")
  ]);

  const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const fileName = `chat-logs-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.send(csv);
}
