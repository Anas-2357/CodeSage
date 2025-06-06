import express from "express";
import { query } from "../controllers/queryController.js";
import { verifyToken } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const guestLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(429).json({
      error: "Guest limit reached. Please register to continue using the service.",
    });
  },
});

const router = express.Router();

router.post("/", verifyToken, query);
router.post("/guest", guestLimiter, query);

export default router;
