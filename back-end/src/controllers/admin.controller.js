import ChatLog from "../models/chatLog.model.js";
import ChatSession from "../models/chatSession.model.js";
import {
  getAdminSettingsRecord,
  updateAdminSettingsRecord
} from "../services/adminSettings.service.js";
import { getScrapeStatus, triggerScrape } from "../services/scrape.service.js";
import { emitRealtime } from "../realtime/socket.js";


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
function escapeRegExp(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const getInformation = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const parsedPage = Number.parseInt(req.query.page, 10);
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const pageNumber = Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1);
    const limitNumber = Number.isNaN(parsedLimit)
      ? 25
      : Math.min(Math.max(parsedLimit, 1), 100);

    const filter = {};

    // Search filter
    if (search) {
      const regex = new RegExp(escapeRegExp(search), "i");

      filter.$or = [
        { sessionId: search },
        { question: search },
        { answer: search },
        { requestMeta: { ip: search } },
        {status: search }
      ];
    }

    const total = await ChatLog.countDocuments(filter);

    const logs = await ChatLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean();

    const totalPages = Math.max(Math.ceil(total / limitNumber), 1);

    res.json({
      logs,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages,
        hasNext: pageNumber < totalPages,
        hasPrev: pageNumber > 1
      }
    });

  } catch (error) {
    console.error("getInformation error:", error);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};

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
    const maxPromptLength = 500;

    if (
      typeof systemPrompt === "string" &&
      systemPrompt.trim().length > maxPromptLength
    ) {
      return res.status(400).json({
        error: `System Prompt must be ${maxPromptLength} characters or less`
      });
    }

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

    emitRealtime("chatbot:visibilityChanged", {
      chatbotEnabled: updated.chatbotEnabled
    });
    emitRealtime("analytics:updated", { source: "settings" });
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
  const { startDate, endDate, type = "all" } = req.query;

  const limit = Math.min(Number(req.query.limit || 5000), 10000);

  const filter = {};

  // Date filter
  if (startDate || endDate) {
    filter.createdAt = {};

    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  // Conversations only
  if (type === "conversations") {
    filter.status = { $in: ["success", "fallback"] };
  }

  const logs = await ChatLog.find(filter)
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
    log.createdAt?.toISOString?.() || "",
    log.sessionId,
    log.status,
    log.question,
    log.answer,
    log.sources?.length || 0,
    log.timingMs?.total || 0,
    log.requestMeta?.ip || "",
  ]);

  const csv = [
    header.join(","),
    ...rows.map((row) =>
      row.map((val) =>
        `"${String(val ?? "").replace(/"/g, '""')}"`
      ).join(",")
    ),
  ].join("\n");

  const fileName = `chat-logs-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}"`
  );

  res.send(csv);
}
