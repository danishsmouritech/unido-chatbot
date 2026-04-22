import express from "express";
import { body, validationResult } from "express-validator";
import {
  createChatSession,
  askQuestion, getChatVisibility
} from "../controllers/chat.controller.js";

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

router.get("/visibility", getChatVisibility);
router.post("/session", createChatSession);
router.post("/ask",
  [
    body('sessionId').trim().isString().notEmpty().withMessage('sessionId is required and must be a string')
      .isLength({ max: 100 }).withMessage('sessionId is too long'),
    body('question').trim().isString().notEmpty().withMessage('question is required and must be a string')
      .isLength({ min: 1, max: 2000 }).withMessage('question must be between 1 and 2000 characters')
  ],
  handleValidationErrors,
  askQuestion
);

export default router;
