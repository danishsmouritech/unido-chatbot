import { logger } from "../utils/logger.js";

/**
 * Security middleware collection for enterprise-grade protection.
 * Implements OWASP Top 10 mitigations.
 */

// ── Request ID ──────────────────────────────────────────────────────────
let requestCounter = 0;
export function requestId(req, _res, next) {
  requestCounter = (requestCounter + 1) % Number.MAX_SAFE_INTEGER;
  req.requestId = `${Date.now()}-${requestCounter}`;
  next();
}

// ── Security Headers (supplement helmet) ────────────────────────────────
export function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0"); // Modern browsers use CSP
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  next();
}

// ── Input Sanitiser ─────────────────────────────────────────────────────
const DANGEROUS_PATTERNS = [
  /<script\b[^>]*>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /\$\{.*\}/,         // Template injection
  /\{\{.*\}\}/,       // Template injection
];

function containsDangerousContent(value) {
  if (typeof value !== "string") return false;
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(value));
}

function sanitizeValue(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function deepSanitize(obj) {
  if (typeof obj === "string") return sanitizeValue(obj);
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  if (obj && typeof obj === "object") {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[sanitizeValue(key)] = deepSanitize(value);
    }
    return cleaned;
  }
  return obj;
}

export function inputSanitizer(req, res, next) {
  // Check for dangerous patterns in request body
  const bodyStr = JSON.stringify(req.body || {});
  if (containsDangerousContent(bodyStr)) {
    logger.error(`Blocked dangerous input (body) from ${req.ip}: ${bodyStr.substring(0, 200)}`);
    return res.status(400).json({ error: "Invalid input detected" });
  }

  // Check query params for dangerous patterns (read-only in Express 5 — validate only, don't reassign)
  const queryStr = JSON.stringify(req.query || {});
  if (containsDangerousContent(queryStr)) {
    logger.error(`Blocked dangerous input (query) from ${req.ip}: ${queryStr.substring(0, 200)}`);
    return res.status(400).json({ error: "Invalid input detected" });
  }

  next();
}

// ── Payload Size Guard ──────────────────────────────────────────────────
export function payloadGuard(req, res, next) {
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);
  const MAX_PAYLOAD = 2 * 1024 * 1024; // 2MB

  if (contentLength > MAX_PAYLOAD) {
    return res.status(413).json({ error: "Payload too large" });
  }
  next();
}

// ── Audit Logger ────────────────────────────────────────────────────────
export function auditLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logEntry = {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("user-agent")?.substring(0, 150),
    };

    // Log errors and slow requests
    if (res.statusCode >= 400 || duration > 5000) {
      logger.error("Request audit:", logEntry);
    }
  });

  next();
}

// ── NoSQL Injection Guard ───────────────────────────────────────────────
function containsNoSQLOperators(obj) {
  if (!obj || typeof obj !== "object") return false;

  for (const key of Object.keys(obj)) {
    if (key.startsWith("$")) return true;
    if (typeof obj[key] === "object" && containsNoSQLOperators(obj[key])) {
      return true;
    }
  }
  return false;
}

export function noSQLInjectionGuard(req, res, next) {
  if (containsNoSQLOperators(req.body)) {
    logger.error(`Blocked NoSQL injection attempt from ${req.ip}`);
    return res.status(400).json({ error: "Invalid input" });
  }
  if (containsNoSQLOperators(req.query)) {
    logger.error(`Blocked NoSQL injection attempt (query) from ${req.ip}`);
    return res.status(400).json({ error: "Invalid input" });
  }
  next();
}

// ── HTTP Method Guard ───────────────────────────────────────────────────
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"]);

export function methodGuard(req, res, next) {
  if (!ALLOWED_METHODS.has(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }
  next();
}

// ── Error Handler (no stack traces in production) ───────────────────────
export function globalErrorHandler(err, req, res, _next) {
  logger.error("Unhandled error:", {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(statusCode).json({ error: message });
}
