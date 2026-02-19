import { useEffect, useState } from "react";
import {
  downloadChatLogsCsv,
  getAdminAnalytics,
  getAdminSettings,
  getScrapeStatus,
  triggerScrape as triggerScrapeRequest,
  updateAdminSettings as updateAdminSettingsRequest
} from "../services/adminService";
import { downloadBlob } from "../utils/fileDownload";

export function useAdminDashboard() {
  const [activeTab, setActiveTab] = useState("analytics");
  const [analytics, setAnalytics] = useState({
  conversations: 0,
  messages: 0,
  userMessages: 0,
  assistantMessages: 0,
  uniqueUsers: 0,
  avgResponseMs: 0,
  errors: 0
});
  const [settings, setSettings] = useState({
    systemPrompt: "",
    chatbotEnabled: true,
    lastScrapeAt: null
  });
  const [scrapeStatus, setScrapeStatus] = useState({
    running: false,
    lastStatus: "idle",
    lastError: null,
    startedAt: null,
    finishedAt: null
  });
  const [message, setMessage] = useState("");

  function getAdminHeaders() {
    const token = localStorage.getItem("adminToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  function handleError(error) {
  console.error(error);
  setMessage(
    error?.message ||
    error?.error ||
    "Something went wrong"
  );
}

  async function refreshAnalytics() {
    try {
      const payload = await getAdminAnalytics(getAdminHeaders());
      setAnalytics(payload);
    } catch (err) {
      handleError(error);
    }
  }

 async function refreshSettings() {
  try {
    const payload = await getAdminSettings(getAdminHeaders());
    setSettings(payload);
  } catch (error) {
    handleError(error);
  }
}

  async function saveSettings() {
    try {
      setMessage("");
      const payload = await updateAdminSettingsRequest(
        {
          systemPrompt: settings.systemPrompt,
          chatbotEnabled: settings.chatbotEnabled
        },
        getAdminHeaders()
      );
      setSettings(payload.settings);
      setMessage("Settings saved");
    } catch (error) {
      handleError(error);
    }
  }
  async function refreshScrapeStatus() {
    const payload = await getScrapeStatus(getAdminHeaders());
    setScrapeStatus(payload);
  }

  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      try {
        await Promise.all([refreshAnalytics(), refreshSettings(), refreshScrapeStatus()]);
      } catch (error) {
        if (mounted) {
          handleError(error);
        }
      }
    }

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrapeStatus.lastStatus !== "running") return;
    const timer = setInterval(() => {
      refreshScrapeStatus().catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [scrapeStatus.lastStatus]); // eslint-disable-line react-hooks/exhaustive-deps

 

  async function triggerScrape() {
    try {
      setMessage("");
      const payload = await triggerScrapeRequest(getAdminHeaders());
      setScrapeStatus(payload.status);
      setMessage(payload.started ? "Scraping started" : "Scraping already running");
    } catch (error) {
      handleError(error);
    }
  }

async function exportCsv(filters) {
  try {
    const { startDate, endDate, format, type } = filters;
    setMessage("");
    const query = new URLSearchParams({
      startDate,
      endDate,
      type,
    }).toString();
        const blob = await downloadChatLogsCsv(query,getAdminHeaders());
    const fileName = `chat-logs-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    downloadBlob(blob, fileName);
  } catch (error) {
    handleError(error);
  }
}

  return {
    activeTab,
    setActiveTab,
    analytics,
    settings,
    setSettings,
    scrapeStatus,
    message,
    saveSettings,
    triggerScrape,
    exportCsv
  };
}
