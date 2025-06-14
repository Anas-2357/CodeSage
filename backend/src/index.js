import express from "express";
import authRoutes from "./routes/authRoutes.js";
import repoRoutes from "./routes/repoRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";
import spacesRoutes from "./routes/spacesRoutes.js";
import connectDB from "./config/db.js";
import rateLimit from "express-rate-limit";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

connectDB();

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many requests from this IP, please try again later.",
    },
});

app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "https://code-sage-pearl.vercel.app",
        ],
        credentials: true,
    })
);
app.use(cookieParser());
app.use(express.json());
app.use(globalLimiter);

app.get("/", (req, res) => {
    res.status(200).send("Server is up and running!");
});

app.use("/auth", authRoutes);
app.use("/repo", repoRoutes);
app.use("/query", queryRoutes);
app.use("/spaces", spacesRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
