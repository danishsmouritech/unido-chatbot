import { apiRequest, buildJsonHeaders } from "../lib/apiClient";
import { APP_CONFIG } from "../config/appConfig";

function withHeaders(headers = {}) {
  return Object.keys(headers).length ? { headers } : {};
}

// Keep this tolerant of older year/month callers while the UI uses date ranges.
function buildAnalyticsDateRange(year, month) {
  const parsedYear = Number.parseInt(year, 10);
  const parsedMonth = Number.parseInt(month, 10);

  if (Number.isNaN(parsedYear)) {
    return {};
  }

  if (Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
    const monthLabel = String(parsedMonth).padStart(2, "0");
    const lastDay = new Date(parsedYear, parsedMonth, 0).getDate();

    return {
      fromDate: `${parsedYear}-${monthLabel}-01`,
      toDate: `${parsedYear}-${monthLabel}-${String(lastDay).padStart(2, "0")}`
    };
  }

  return {
    fromDate: `${parsedYear}-01-01`,
    toDate: `${parsedYear}-12-31`
  };
}

export function getAdminAnalytics(filtersOrYear = {}, monthOrHeaders, maybeHeaders) {
  let filters = {};
  let headers = {};

  if (
    filtersOrYear &&
    typeof filtersOrYear === "object" &&
    !Array.isArray(filtersOrYear)
  ) {
    filters = filtersOrYear;
    headers = monthOrHeaders || {};
  } else {
    filters = buildAnalyticsDateRange(filtersOrYear, monthOrHeaders);
    if (
      maybeHeaders &&
      typeof maybeHeaders === "object" &&
      !Array.isArray(maybeHeaders)
    ) {
      headers = maybeHeaders;
    } else if (
      monthOrHeaders &&
      typeof monthOrHeaders === "object" &&
      !Array.isArray(monthOrHeaders)
    ) {
      headers = monthOrHeaders;
    }
  }

  const params = new URLSearchParams();

  if (filters.fromDate) params.append("fromDate", filters.fromDate);
  if (filters.toDate) params.append("toDate", filters.toDate);
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  return apiRequest(`/api/admin/analytics${suffix}`, withHeaders(headers));
}

export async function getAllInformation(headers = {}, query = {}) {

  const params = new URLSearchParams();

  Object.keys(query).forEach((key) => {
    if (query[key] !== undefined && query[key] !== "") {
      params.append(key, query[key]);
    }
  });
  const queryString = params.toString();
  const suffix = queryString ? `?${queryString}` : "";
  return apiRequest(`/api/admin/allInformation${suffix}`, withHeaders(headers));
}
export function loginAdmin(payload) {
  return apiRequest("/api/admin/auth/login", {
    method: "POST",
    headers: buildJsonHeaders(),
    body: JSON.stringify(payload)
  });
}

export function logoutAdmin(headers) {
  return apiRequest("/api/admin/auth/logout", {
    method: "POST",
    ...withHeaders(headers)
  });
}

export function getAdminSettings(headers) {
  return apiRequest("/api/admin/settings", withHeaders(headers));
}

export function updateAdminSettings(payload, headers) {
  return apiRequest("/api/admin/settings", {
    method: "PUT",
    headers: buildJsonHeaders(headers),
    body: JSON.stringify(payload)
  });
}

export function getScrapeStatus(headers) {
  return apiRequest("/api/admin/scrape/status", withHeaders(headers));
}

export function triggerScrape(headers) {
  return apiRequest("/api/admin/scrape/trigger", {
    method: "POST",
    ...withHeaders(headers)
  });
}

export async function downloadChatLogsCsv(query,headers) {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/api/admin/reports/chat-logs?${query}`, {
    headers
  });

  if (!response.ok) {
    const error = new Error("Failed to download CSV report");
    error.status = response.status;
    throw error;
  }

  return response.blob();
}
