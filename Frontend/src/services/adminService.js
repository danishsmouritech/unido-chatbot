import { apiRequest, buildJsonHeaders } from "../lib/apiClient";
import { APP_CONFIG } from "../config/appConfig";

function withHeaders(headers = {}) {
  return Object.keys(headers).length ? { headers } : {};
}

export function getAdminAnalytics(year, month, headers) {
   const params = new URLSearchParams();

  if (year) params.append("year", year);
  if (month) params.append("month", month);
  return apiRequest(`/api/admin/analytics?${params.toString()}`, withHeaders(headers));
}
export async function getAllInformation(headers = {}, query = {}) {

  const params = new URLSearchParams();

  Object.keys(query).forEach((key) => {
    if (query[key] !== undefined && query[key] !== "") {
      params.append(key, query[key]);
    }
  });
  return apiRequest(`/api/admin/allInformation?${params.toString()}`, withHeaders(headers));
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
