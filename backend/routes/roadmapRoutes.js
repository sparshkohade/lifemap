import express from "express";
import {
  generateRoadmap,
  generateQuiz,
  evaluateQuiz,
  getUserRoadmaps,
  saveRoadmap,
} from "../controllers/roadmapController.js";

const router = express.Router();

router.post("/generateRoadmap", generateRoadmap);
router.post("/generateQuiz", generateQuiz);
router.post("/evaluateQuiz", evaluateQuiz);
router.get("/user/:userId", getUserRoadmaps);
router.post("/save", saveRoadmap);

export default router;
