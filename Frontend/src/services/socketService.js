import { io } from "socket.io-client";
import { APP_CONFIG } from "../config/appConfig";

let socket = null;

export function getSocket() {
  if (!socket) {
    // Only send auth token if it exists (admin )
    const token = localStorage.getItem("adminToken");
    const socketConfig = {
      autoConnect: true,
      transports: ["websocket", "polling"]
    };

    // Only add auth if token exists
    if (token) {
      socketConfig.auth = { token };
    }

    socket = io(APP_CONFIG.API_BASE_URL, socketConfig);

    // Handle connection errors gracefully
    socket.on("connect_error", (error) => {
      console.warn("Socket connection error:", error.message);
      // Connection will retry automatically
    });
  }

  return socket;
}

