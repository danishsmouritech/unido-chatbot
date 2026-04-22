import express from "express";
import { body, validationResult } from "express-validator";
import {
  loginAdminController,
  logoutAdminController
} from "../controllers/adminAuth.controller.js";
import { requireAdminAuth } from "../middleware/adminAuth.middleware.js";

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

router.post("/login",
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isString().isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters')
  ],
  handleValidationErrors,
  loginAdminController
);
router.post("/logout", requireAdminAuth, logoutAdminController);

export default router;
