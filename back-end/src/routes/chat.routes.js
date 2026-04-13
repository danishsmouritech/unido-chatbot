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
    body('sessionId').trim().isString().notEmpty().withMessage('sessionId is required and must be a string'),
    body('question').trim().escape().isString().notEmpty().withMessage('question is required and must be a string')
  ],
  handleValidationErrors,
  askQuestion
);

export default router;
