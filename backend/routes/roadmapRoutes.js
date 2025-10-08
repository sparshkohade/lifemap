import express from "express";
import {
  generateRoadmap,
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

export default router;
