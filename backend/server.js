// server.js
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import events from "events";

import authRoutes from "./routes/authRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import roadmapRoutes from "./routes/roadmapRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import groupsRoutes from "./routes/groups.js";
import exportRoutes from "./routes/export.js";

dotenv.config();

const app = express();

/**
 * CORS + Cookie parsing
 * Allow multiple local dev origins and return per-request origin for credentials.
 */
const FRONTEND_WHITELIST = [
  process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server)
      if (!origin) return callback(null, true);
      if (FRONTEND_WHITELIST.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error("CORS: Origin not allowed"), false);
    },
    credentials: true,
    exposedHeaders: ["Set-Cookie"],
  })
);

app.use(express.json());
app.use(cookieParser());

events.defaultMaxListeners = 20;

/**
 * Routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/roadmaps", roadmapRoutes);
app.use("/api/user", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/export", exportRoutes);

app.get("/", (_req, res) => res.send("✅ LifeMap API running..."));

/**
 * Error handler (basic)
 */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message || err);
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ error: "CORS error: origin not allowed" });
  }
  res.status(500).json({ error: "Server error" });
});

/**
 * DB connection & server start
 */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  try {
    if (!MONGO_URI) throw new Error("MONGO_URI not defined in environment");

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected");

    const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

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
