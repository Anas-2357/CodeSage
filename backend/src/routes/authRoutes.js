import express from "express";
import { sendOtp, verifyOtp } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", sendOtp);
router.post("/verify-otp", verifyOtp);


export default router;
