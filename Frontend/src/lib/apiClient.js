import { APP_CONFIG } from "../config/appConfig";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}${path}`, options);
  const payload = await parseResponse(response);

  if (!response.ok) {
    const message = payload?.error || payload?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

export function buildJsonHeaders(extraHeaders = {}) {
  return {
    "Content-Type": "application/json",
    ...extraHeaders
  };
}
