import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AdminUser from "../models/adminUser.model.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = "8h";

// Create default admin
export async function ensureDefaultAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@unido.local";
  const password = process.env.ADMIN_PASSWORD || "Admin@123";

  const exists = await AdminUser.findOne({ email });
  if (exists) return;

  const hashedPassword = await bcrypt.hash(password, 10);

  await AdminUser.create({
    username: "admin",
    email,
    password: hashedPassword
  });

  console.log("Default admin created");
}


export async function loginAdmin(email, password) {
  const user = await AdminUser.findOne({ email, isActive: true });
  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
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
