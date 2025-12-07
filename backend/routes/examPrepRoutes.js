// backend/routes/examPrepRoutes.js
import express from "express";
import { generateQuestionPaper } from "../controllers/examPrepController.js";

const router = express.Router();

// Limit how many questions a client can request through the mock endpoint
const MAX_COUNT = Number(process.env.EXAM_MAX_COUNT || 50);

// Optional small admin secret (set in .env) to allow returning answers via keepAnswers flag.
// NOTE: This is a convenience — replace with proper auth for production.
const KEEP_ANSWERS_SECRET = process.env.KEEP_ANSWERS_SECRET || "";

router.post("/question-paper", async (req, res, next) => {
  try {
    console.log("[examprep] POST /question-paper - req.body keys:", Object.keys(req.body || {}));

    const { topic, subject, count, difficulty, topics, keepAnswers, adminSecret } = req.body || {};

    // Accept either topic or subject
    const rawTopic = (typeof topic === "string" && topic.trim())
      ? topic
      : (typeof subject === "string" && subject.trim() ? subject : null);

    if (!rawTopic) {
      return res.status(400).json({ error: "Missing or invalid 'topic' (string required)" });
    }

    const safeTopic = rawTopic.trim();
    const qCount = Number.isInteger(Number(count)) && Number(count) > 0 ? Number(count) : 5;
    if (qCount > MAX_COUNT) {
      return res.status(400).json({ error: `count too large (max ${MAX_COUNT})` });
    }

    const safeDifficulty = typeof difficulty === "string" && difficulty.trim() ? difficulty.trim() : "mixed";
    const safeTopics = typeof topics === "string" ? topics.trim() : "";

    // If keepAnswers requested, allow only when correct adminSecret is provided
    const wantAnswers = !!keepAnswers;
    if (wantAnswers && KEEP_ANSWERS_SECRET) {
      if (String(adminSecret || "") !== KEEP_ANSWERS_SECRET) {
        return res.status(403).json({ error: "Forbidden: invalid admin secret for keepAnswers" });
      }
    } else if (wantAnswers && !KEEP_ANSWERS_SECRET) {
      // If no secret configured, disallow keepAnswers for safety
      return res.status(403).json({ error: "keepAnswers is not allowed on this endpoint" });
    }

    const paper = await generateQuestionPaper({
      topic: safeTopic,
      count: qCount,
      difficulty: safeDifficulty,
      topics: safeTopics,
    });

    // If caller requested answers and is authorized, attach answers; otherwise strip them
    let responsePaper = paper;
    if (!wantAnswers) {
      // Remove `answer` fields from each question for safety
      responsePaper = {
        ...paper,
        questions: (paper.questions || []).map(q => {
          const { answer, ...rest } = q;
          return rest;
        }),
      };
    }

    return res.status(200).json({ success: true, paper: responsePaper });
  } catch (err) {
    console.error("[examprep route] error:", err && (err.stack || err.message || err));
    next(err);
  }
});

export default router;
