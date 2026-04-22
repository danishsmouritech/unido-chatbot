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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
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

  const refreshAnalytics = useCallback(
    async (filters = {}) => {
      const selectedFromDate = filters.fromDate ?? fromDate;
      const selectedToDate = filters.toDate ?? toDate;
      const normalizedToDate =
        selectedFromDate &&
        selectedToDate &&
        selectedFromDate > selectedToDate
          ? selectedFromDate
          : selectedToDate;
      try {
        const payload = await getAdminAnalytics(
          {
            fromDate: selectedFromDate,
            toDate: normalizedToDate
          },
          getAdminHeaders()
        );
        setAnalytics(payload);
      } catch (error) {
        handleError(error);
      }
    },
    [fromDate, getAdminHeaders, handleError, toDate]
  );

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
  const refreshSettings = useCallback(async () => {
    try {
      const payload = await getAdminSettings(getAdminHeaders());
      setSettings(payload);
    } catch (error) {
      handleError(error);
    }
  }, [getAdminHeaders, handleError]);

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

  const refreshScrapeStatus = useCallback(async () => {
    try {
      const payload = await getScrapeStatus(getAdminHeaders());
      setScrapeStatus(payload);
    } catch (error) {
      handleError(error);
    }
  }, [getAdminHeaders, handleError]);

  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      try {
        await Promise.all([
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
  }, [handleError, refreshInformation, refreshScrapeStatus, refreshSettings]);

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  useEffect(() => {
    if (scrapeStatus.lastStatus !== "running") return;
    const timer = setInterval(() => {
      refreshScrapeStatus().catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [refreshScrapeStatus, scrapeStatus.lastStatus]);

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

  async function exportCsv(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.type) params.append("type", filters.type);

      const blob = await downloadChatLogsCsv(
        params.toString(),
        getAdminHeaders()
      );
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
    fromDate,
    toDate,
    setFromDate,
    setToDate,
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
