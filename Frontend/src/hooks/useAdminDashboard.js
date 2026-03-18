import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  downloadChatLogsCsv,
  getAdminAnalytics,
  getAllInformation,
  getAdminSettings,
  getScrapeStatus,
  triggerScrape as triggerScrapeRequest,
  updateAdminSettings as updateAdminSettingsRequest
} from "../services/adminService";
import { downloadBlob } from "../utils/fileDownload";
import { getSocket } from "../services/socketService";
import { logger } from "../utils/logger";
export function useAdminDashboard() {
  const navigate = useNavigate();
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
  const [information, setInformation] = useState([]);
  const [informationLoading, setInformationLoading] = useState(false);
  const [informationQuery, setInformationQuery] = useState({
    page: 1,
    limit: 25,
    search: ""
  });
  const informationQueryRef = useRef({
    page: 1,
    limit: 25,
    search: ""
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1
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
const [notification, setNotification] = useState(null);
  const getAdminHeaders = useCallback(() => {
    const token = localStorage.getItem("adminToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);
  const handleError = useCallback((error) => {
    if (error?.status === 401) {
     setNotification({
    type: "error",
    text: "Session expired, please log in again"
  });
    localStorage.removeItem("adminToken");
    navigate("/login", { replace: true });
    return;
  }

  logger.error(error);
  setNotification({
    type: "error",
    text: error?.message || error?.error || "Something went wrong"
  });
  }, [navigate]);

  async function refreshAnalytics() {
    try {
      const payload = await getAdminAnalytics(getAdminHeaders());
      setAnalytics(payload);
    } catch (error) {
      handleError(error);
    }
  }

 const refreshInformation = useCallback(async (queryUpdate = {}) => {
    const updatedQuery = {
      ...informationQueryRef.current,
      ...queryUpdate
    };
    informationQueryRef.current = updatedQuery;
    setInformationQuery(updatedQuery);
    setInformationLoading(true);

    try {
      const response = await getAllInformation(getAdminHeaders(), updatedQuery);
      setInformation(response.logs || []);
      setPagination(response.pagination || {});
    } catch (error) {
      handleError(error);
    } finally {
      setInformationLoading(false);
    }

  }, [getAdminHeaders, handleError]);

  const onQueryChange = useCallback((changes) => {
    refreshInformation(changes);
  }, [refreshInformation]);
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
      const payload = await updateAdminSettingsRequest(
        {
          systemPrompt: settings.systemPrompt,
          chatbotEnabled: settings.chatbotEnabled
        },
        getAdminHeaders()
      );
      setSettings(payload.settings);
     setNotification({
      type: "success",
      text: "Settings saved"
    });
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
        await Promise.all([
          refreshAnalytics(),
          refreshInformation(),
          refreshSettings(),
          refreshScrapeStatus()
        ]);
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

  useEffect(() => {
    const socket = getSocket();
    const handleRealtimeUpdate = () => {
      refreshAnalytics().catch(() => {});
      // Preserve current query state when refreshing from socket
      refreshInformation({}).catch(() => {});
    };

    socket.on("analytics:updated", handleRealtimeUpdate);
    socket.on("information:updated", handleRealtimeUpdate);
    return () => {
      socket.off("analytics:updated", handleRealtimeUpdate);
      socket.off("information:updated", handleRealtimeUpdate);
    };
  }, [refreshAnalytics, refreshInformation]);

 

  async function triggerScrape() {
    try {
      const payload = await triggerScrapeRequest(getAdminHeaders());
      setScrapeStatus(payload.status);
      setNotification({
        type: payload.started ? "success" : "warning",
        text: payload.started
          ? "Scraping started"
          : "Scraping already running"
      });
    } catch (error) {
      handleError(error);
    }
  }

async function exportCsv(filters) {
  try {
    const { startDate, endDate, type } = filters;
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
    setNotification({
      type: "success",
      text: "Export started, check your downloads folder shortly."
    });
  } catch (error) {
    handleError(error);
  }
}

  return {
    activeTab,
    setActiveTab,
    analytics,
     information,
    informationLoading,
    informationQuery,
    pagination,
    onQueryChange,
    settings,
    setSettings,
    scrapeStatus,
   notification,
    saveSettings,
    triggerScrape,
    exportCsv
  };
}
