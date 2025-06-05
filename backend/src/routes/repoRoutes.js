import express from "express";
import { ingestRepository } from "../controllers/repoController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/ingest", verifyToken, ingestRepository);

export default router;
