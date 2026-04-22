import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AdminUser from "../models/adminUser.model.js";
import { logger } from "../utils/logger.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || "25m";
const BCRYPT_ROUNDS = 12;

export function assertAdminAuthConfig() {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is required for admin authentication");
  }
  if (process.env.NODE_ENV === "production" && JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
}

// Create default admin
export async function ensureDefaultAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to bootstrap admin user");
  }

  if (password.length < 12) {
    logger.error("WARNING: ADMIN_PASSWORD should be at least 12 characters for production security");
  }

  const exists = await AdminUser.findOne({ email });
  if (exists) return;

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await AdminUser.create({
    username: "admin",
    email,
    password: hashedPassword
  });

  logger.log("Default admin created");
}


export async function loginAdmin(email, password) {
  assertAdminAuthConfig();

  const user = await AdminUser.findOne({ email, isActive: true });

  // Constant-time comparison: always hash even if user not found
  if (!user) {
    await bcrypt.hash("dummy-password-for-timing", BCRYPT_ROUNDS);
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES,
      algorithm: "HS256"
    }
  );

  return {
    token,
    admin: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  };
}
