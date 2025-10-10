import express from "express";
import {
  generateRoadmap,
  saveRoadmap,
  generateQuiz,
  evaluateQuiz,
  getUserRoadmaps,
} from "../controllers/roadmapController.js";

const router = express.Router();

/**
 * @route   POST /api/roadmap
 * @desc    Generate & save personalized roadmap
 * @body    { goal: string, level: string, userId: string }
 */
router.post("/", generateRoadmap);

/**
 * @route   GET /api/roadmap/:userId
 * @desc    Get all roadmaps for a specific user
 */
router.get("/:userId", getUserRoadmaps);

router.post("/generate", generateRoadmap);
router.post("/save", saveRoadmap); // ✅ New route to save roadmap
router.post("/quiz", generateQuiz);
router.post("/evaluate", evaluateQuiz);

export default router;
