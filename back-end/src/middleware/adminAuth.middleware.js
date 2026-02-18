export function requireAdminAuth(req, res, next) {
  const expectedToken = process.env.ADMIN_TOKEN;

  // If token not configured, keep admin endpoints open for local/dev use.
  if (!expectedToken) return next();

  const authHeader = req.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const headerToken = req.get("x-admin-token");
  const token = bearerToken || headerToken;

  if (token !== expectedToken) {
    return res.status(401).json({ error: "Unauthorized admin request" });
  }

  next();
}
