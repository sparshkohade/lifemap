// server.js
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import roadmapRoutes from "./routes/roadmapRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import groupsRoutes from "./routes/groups.js"; // <-- new
// import connectDB from "./config/db.js"; // optional if you use a connect helper

dotenv.config();

const app = express();

/**
 * Middleware
 */
// Recommended single CORS config for your frontend (Vite default at :5173)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

/**
 * Routes
 * Keep mounting order consistent with your app
 */
app.use("/api/auth", authRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/user", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/groups", groupsRoutes); // <-- groups API

// Health / test route
app.get("/", (_req, res) => res.send("✅ LifeMap API running..."));

/**
 * Error handler (basic)
 */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Server error" });
});

/**
 * DB connection & server start
 */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI not defined in environment");
    }

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected");

    const server = app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );

    // Graceful shutdown
    const shutDown = async (signal) => {
      console.log(`\n⚠️  Received ${signal}. Closing server...`);
      server.close(async () => {
        try {
          await mongoose.disconnect();
          console.log("✅ MongoDB disconnected");
          process.exit(0);
        } catch (e) {
          console.error("Error during shutdown:", e);
          process.exit(1);
        }
      });

      // Force exit after 10s
      setTimeout(() => {
        console.warn("Forcing exit...");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGINT", () => shutDown("SIGINT"));
    process.on("SIGTERM", () => shutDown("SIGTERM"));
  } catch (err) {
    console.error("❌ DB Error:", err);
    process.exit(1);
  }
}

start();
