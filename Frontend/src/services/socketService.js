import { io } from "socket.io-client";
import { APP_CONFIG } from "../config/appConfig";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(APP_CONFIG.API_BASE_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      auth: {
        token: localStorage.getItem("adminToken")
      }
    });
  }

  return socket;
}

