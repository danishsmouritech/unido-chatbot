import express from "express";
import { requireAdminAuth } from "../middleware/adminAuth.middleware.js";
import {
  exportChatLogsCsv,
  getAdminAnalytics,
  getAdminScrapeStatus,
  getAdminSettings,
  triggerAdminScrape,
  updateAdminSettings
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(requireAdminAuth);
router.get("/analytics", getAdminAnalytics);
router.get("/settings", getAdminSettings);
router.put("/settings", updateAdminSettings);
router.post("/scrape/trigger", triggerAdminScrape);
router.get("/scrape/status", getAdminScrapeStatus);
router.get("/reports/chat-logs.csv", exportChatLogsCsv);

export default router;
