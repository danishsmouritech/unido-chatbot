import express from "express";
import {
  loginAdminController,
  logoutAdminController
} from "../controllers/adminAuth.controller.js";
import { requireAdminAuth } from "../middleware/adminAuth.middleware.js";

const router = express.Router();

router.post("/login", loginAdminController);
router.post("/logout", requireAdminAuth, logoutAdminController);

export default router;
