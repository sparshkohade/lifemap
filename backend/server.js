// server.js
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import { EventEmitter } from "events";

// Routes
import authRoutes from "./routes/authRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import roadmapRoutes from "./routes/roadmapRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import groupsRoutes from "./routes/groups.js";
import exportRoutes from "./routes/export.js";
import examPrepRoutes from "./routes/examPrepRoutes.js";

const app = express();

// Avoid MaxListeners warning
EventEmitter.defaultMaxListeners =
  Number(process.env.DEFAULT_MAX_LISTENERS) || 20;

//
// ✅ CORS CONFIG (FIXED FOR DEPLOYMENT)
//
const allowedOrigins = [
  process.env.CLIENT_URL,        // Vercel frontend
  "http://localhost:5173",       // local dev
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow Postman

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS: Origin not allowed"), false);
    },
    credentials: true,
  })
);

//
// ✅ MIDDLEWARES
//
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

//
// ✅ REQUEST LOGGER (safe)
//
app.use((req, res, next) => {
  console.log(`--> ${req.method} ${req.originalUrl}`);
  next();
});

//
// ✅ ROUTES
//
app.use("/api/auth", authRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/roadmaps", roadmapRoutes);
app.use("/api/user", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/examprep", examPrepRoutes);

app.get("/", (_req, res) => {
  res.send("✅ LifeMap API running...");
});

//
// ✅ ERROR HANDLER
//
app.use((err, req, res, next) => {
  console.error("❌ Error:", err?.message || err);

  if (err.message?.includes("CORS")) {
    return res.status(403).json({
      error: "CORS error: origin not allowed",
    });
  }

  res.status(500).json({
    error: err.message || "Server error",
  });
});

//
// ✅ DATABASE + SERVER START
//
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function start() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI not defined");
    }

    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  }
}

start();