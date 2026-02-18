import { apiRequest, buildJsonHeaders } from "../lib/apiClient";

export function createChatSession() {
  return apiRequest("/api/chat/session", { method: "POST" });
}

export function getChatVisibility() {
  return apiRequest("/api/chat/visibility", { method: "GET" });
}

export function askChatQuestion(payload) {
  return apiRequest("/api/chat/ask", {
    method: "POST",
    headers: buildJsonHeaders(),
    body: JSON.stringify(payload)
  });
}
