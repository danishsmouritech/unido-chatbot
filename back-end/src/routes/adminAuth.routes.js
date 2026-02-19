import express from "express";
import { loginAdminController } from "../controllers/adminAuth.controller.js";

const router = express.Router();

router.post("/login", loginAdminController);

export default router;
