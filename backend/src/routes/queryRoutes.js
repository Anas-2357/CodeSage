import express from "express";
import { query } from "../controllers/queryController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/", verifyToken, query);

export default router;
