import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";

export function requireAdminAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;

    if (!auth?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = auth.split(" ")[1];

    if (!token || token.split(".").length !== 3) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      maxAge: "30m"
    });

    if (!decoded?.role || decoded.role !== "admin") {
      logger.error(`Forbidden access attempt: role=${decoded?.role}, ip=${req.ip}`);
      return res.status(403).json({ error: "Forbidden" });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      logger.error(`Invalid JWT attempt from ${req.ip}: ${err.message}`);
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(401).json({ error: "Authentication failed" });
  }
}