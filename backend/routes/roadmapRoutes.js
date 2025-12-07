// backend/routes/roadmapRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import checkOwnership from "../middleware/checkOwnership.js";
import * as roadmapController from "../controllers/roadmapController.js";

const router = express.Router();

/**
 * Public generation & helper endpoints
 * Keep these first (they are named routes and should not be shadowed by /:id)
 */
router.post("/generate", roadmapController.generateRoadmap);
router.post("/recommendations", roadmapController.recommendations);
router.get("/latest", roadmapController.latestDemo);

// Node details used by frontend when clicking a node
router.get("/nodes/:id", roadmapController.getNodeDetails);

/**
 * Demo / utility endpoints
 * (kept public — adjust protect() if you want them protected)
 */
router.post("/demo/generate", roadmapController.generateDemoRoadmap);

/**
 * Save / list user roadmaps
 * - Save is protected in your original file; keep it protected (you can remove protect if you want anonymous saves)
 * - User list is protected
 */
router.post("/save", protect, roadmapController.saveRoadmap);
router.get("/user/:userId", protect, roadmapController.getUserRoadmaps);

/**
 * Quiz endpoints (protected in original file)
 */
router.post("/generate-quiz", protect, roadmapController.generateQuiz);
router.post("/evaluate-quiz", protect, roadmapController.evaluateQuiz);

/**
 * Gantt endpoint(s) — place before the param `/:id` CRUD routes to avoid clash
 */
router.get("/:id/gantt", protect, checkOwnership, roadmapController.getGanttData);
router.post("/:id/gantt", protect, checkOwnership, roadmapController.getGanttData);

/**
 * CRUD + ownership-protected routes
 * Keep these last so named routes (above) are matched first.
 */
router.post("/create", protect, roadmapController.createRoadmap);
router.get("/:id", protect, checkOwnership, roadmapController.getRoadmap);
router.put("/:id", protect, checkOwnership, roadmapController.updateRoadmap);
router.delete("/:id", protect, checkOwnership, roadmapController.deleteRoadmap);

export default router;
