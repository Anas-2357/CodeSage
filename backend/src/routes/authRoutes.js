import express from "express";
import { login, sendOtp, verifyOtp } from "../controllers/authController.js";
import rateLimit from "express-rate-limit";

const registerLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: {
    error: "Too many registration requests. Please wait before trying again.",
  },
});

const verifyOtpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many OTP requests. Please wait before trying again.",
  },
});

const router = express.Router();

router.post("/register", registerLimiter, sendOtp);
router.post("/verify-otp", verifyOtpLimiter, verifyOtp);
router.post("/login", login);


export default router;
