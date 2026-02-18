import express from "express";
import {
  createChatSession,
  askQuestion, getChatVisibility
} from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/visibility", getChatVisibility);
router.post("/session", createChatSession);
router.post("/ask", askQuestion);

export default router;
