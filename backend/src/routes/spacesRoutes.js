import express from "express";
import {
    getPublicSpaces,
    getUserSpaces,
} from "../controllers/spacesController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, getUserSpaces);
router.get("/guest", getPublicSpaces);

export default router;
