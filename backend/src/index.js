import express from "express";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import repoRoutes from "./routes/repoRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";
import connectDB from "./config/db.js";

const app = express();  // <-- Initialize express app

connectDB();

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/repo", repoRoutes);
app.use("/query", queryRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
