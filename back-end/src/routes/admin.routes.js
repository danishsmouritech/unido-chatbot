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
router.get("/allInformation",
  [
    query('page').optional().isInt({ min: 1, max: 10000 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
    query('search').optional().isString().isLength({ max: 200 }).withMessage('search must be 200 chars or less')
  ],
  handleValidationErrors,
  getInformation
);
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
router.get("/reports/chat-logs",
  [
    query('startDate').optional({ checkFalsy: true }).isISO8601({ strict: true }).withMessage('Start date must be valid'),
    query('endDate').optional({ checkFalsy: true }).isISO8601({ strict: true }).withMessage('End date must be valid'),
    query('type').optional().isIn(['all', 'conversations']).withMessage('type must be all or conversations'),
    query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('limit must be between 1 and 10000')
  ],
  handleValidationErrors,
  exportChatLogsCsv
);

export default router;
