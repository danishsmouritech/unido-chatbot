import crypto from "crypto";
import AdminUser from "../models/adminUser.model.js";

const TOKEN_TTL_HOURS = Number(process.env.ADMIN_TOKEN_TTL_HOURS || 12);

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function verifyPassword(password, user) {
  const hash = hashPassword(password, user.passwordSalt);
  return hash === user.passwordHash;
}

export async function ensureDefaultAdminUser() {
  const defaultEmail = (process.env.ADMIN_EMAIL || "admin@unido.local").toLowerCase();
  const defaultUsername = process.env.ADMIN_USERNAME || "admin";
  const defaultPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  const existing = await AdminUser.findOne({ email: defaultEmail });
  if (existing) return existing;

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(defaultPassword, salt);

  return AdminUser.create({
    username: defaultUsername,
    email: defaultEmail,
    passwordHash,
    passwordSalt: salt
  });
}

export async function loginAdminUser({ email, password }) {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const user = await AdminUser.findOne({ email: normalizedEmail, isActive: true });

  if (!user || !verifyPassword(String(password || ""), user)) {
    return null;
  }

  const authToken = crypto.randomBytes(48).toString("hex");
  const authTokenExpiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  user.authToken = authToken;
  user.authTokenExpiresAt = authTokenExpiresAt;
  user.lastLoginAt = new Date();
  await user.save();

  return {
    token: authToken,
    expiresAt: authTokenExpiresAt,
    admin: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  };
}

export async function getAdminByToken(token) {
  if (!token) return null;

  const user = await AdminUser.findOne({
    authToken: token,
    isActive: true,
    authTokenExpiresAt: { $gt: new Date() }
  });

  return user;
}

export async function logoutAdminByToken(token) {
  if (!token) return;

  await AdminUser.updateOne(
    { authToken: token },
    {
      $set: {
        authToken: null,
        authTokenExpiresAt: null
      }
    }
  );
}
