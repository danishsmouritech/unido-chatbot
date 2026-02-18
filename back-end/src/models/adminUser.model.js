import mongoose from "mongoose";

const adminUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    authToken: { type: String, default: null, index: true },
    authTokenExpiresAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const AdminUser = mongoose.model("AdminUser", adminUserSchema);

export default AdminUser;
