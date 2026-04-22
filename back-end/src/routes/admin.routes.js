import express from "express";
import { body, query, validationResult } from "express-validator";
import { requireAdminAuth } from "../middleware/adminAuth.middleware.js";
import {
  exportChatLogsCsv,
  getAdminAnalytics,
  getInformation,
  getAdminScrapeStatus,
  getAdminSettings,
  triggerAdminScrape,
  updateAdminSettings
} from "../controllers/admin.controller.js";

const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array()
    });
  }
  next();
};

router.use(requireAdminAuth);
router.get("/analytics",
  [
    query('fromDate').optional({ checkFalsy: true }).isISO8601({ strict: true }).withMessage('From date must be a valid YYYY-MM-DD date'),
    query('toDate').optional({ checkFalsy: true }).isISO8601({ strict: true }).withMessage('To date must be a valid YYYY-MM-DD date')
  ],
  handleValidationErrors,
  getAdminAnalytics
);
router.get("/allInformation", getInformation);
router.get("/settings", getAdminSettings);
router.put("/settings",
  [
    body('systemPrompt').optional().isString().isLength({ max: 500 }).withMessage('System prompt must be 500 characters or less'),
    body('chatbotEnabled').optional().isBoolean().withMessage('chatbotEnabled must be a boolean')
  ],
  handleValidationErrors,
  updateAdminSettings
);
router.post("/scrape/trigger", triggerAdminScrape);
router.get("/scrape/status", getAdminScrapeStatus);
router.get("/reports/chat-logs", exportChatLogsCsv);

export default router;
