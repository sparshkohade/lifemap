// server.js
import 'dotenv/config'; // loads .env automatically for ESM
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import { EventEmitter } from "events";

import authRoutes from "./routes/authRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import roadmapRoutes from "./routes/roadmapRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import groupsRoutes from "./routes/groups.js";
import exportRoutes from "./routes/export.js";
import examPrepRoutes from './routes/examPrepRoutes.js';

const app = express();

// Increase EventEmitter default listeners (avoid MaxListeners warnings in dev)
EventEmitter.defaultMaxListeners = Number(process.env.DEFAULT_MAX_LISTENERS || 20);

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

// Limit the JSON body size to protect from huge requests
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Simple request logging (safe truncation for bodies)
app.use((req, res, next) => {
  console.log(`--> ${req.method} ${req.originalUrl}`);
  if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
    try {
      const s = JSON.stringify(req.body);
      console.log("Body:", s.length > 2000 ? s.slice(0, 2000) + '... [truncated]' : s);
    } catch (e) {
      console.log("Body: <unserializable>");
    }
  }
  next();
});

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
app.use('/api/examprep', examPrepRoutes);

app.get("/", (_req, res) => res.send("✅ LifeMap API running..."));

/**
 * Error handler (dev-friendly)
 */
app.use((err, req, res, next) => {
  // Log full error in server
  console.error("Unhandled error:", err && (err.stack || err.message || err));

  // Handle CORS origin error explicitly
  if (err && err.message && err.message.includes("CORS")) {
    return res.status(403).json({ error: "CORS error: origin not allowed" });
  }

  const dev = (process.env.NODE_ENV || 'development') === 'development';
  const payload = { error: err?.message || 'Server error' };
  if (dev) payload.stack = err?.stack;

  res.status(err?.status || 500).json(payload);
});

/**
 * DB connection & server start
 */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

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

    // Catch unhandled rejections / exceptions and log (avoid silent failures)
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      // optionally exit or let the graceful handler manage it
    });
  } catch (err) {
    console.error("❌ DB Error:", err);
    process.exit(1);
  }
}

start();
