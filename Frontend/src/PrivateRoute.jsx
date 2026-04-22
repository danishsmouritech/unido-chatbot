import { Navigate } from "react-router-dom";
import { logger } from "./utils/logger";

function isTokenValid(token) {
  try {
    // Basic JWT format check (3 dot-separated base64 segments)
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));

    // Check required claims
    if (!payload?.exp || !payload?.role) return false;

    // Check expiration with 30s buffer
    const isExpired = payload.exp * 1000 <= Date.now() + 30000;
    if (isExpired) {
      logger.log("Token expired or about to expire");
      return false;
    }

    // Check role
    if (payload.role !== "admin") return false;

    return true;
  } catch {
    return false;
  }
}

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("adminToken");

  if (!token || !isTokenValid(token)) {
    localStorage.removeItem("adminToken");
    return <Navigate to="/login" replace />;
  }

  return children;
}
