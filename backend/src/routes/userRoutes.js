import express from "express";
import { pushUrl } from "../controllers/userController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/pushUrl", verifyToken, pushUrl);

export default router;
