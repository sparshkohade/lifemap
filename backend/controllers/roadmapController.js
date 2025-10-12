import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import Roadmap from "../models/roadmapModel.js";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/* ---------------------------------------------------
 🧭 Generate AI Roadmap
--------------------------------------------------- */
export const generateRoadmap = async (req, res) => {
  const { goal, level } = req.body;
  if (!goal || !level)
    return res.status(400).json({ error: "Goal and level are required" });

  try {
    const prompt = `
      Generate a personalized career roadmap for someone who wants to "${goal}".
      Skill level: "${level}".
      Include title, description, and estimated time for each step.
      Output as a JSON array:
      [
        {"title": "...", "description": "...", "estimatedTime": "..."},
        ...
      ]
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract only JSON portion safely
    const jsonMatch = text.match(/\[.*\]/s);
    const steps = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json({ steps });
  } catch (err) {
    console.error("❌ Roadmap generation failed:", err);
    res.status(500).json({ error: "Failed to generate roadmap" });
  }
};

/* ---------------------------------------------------
 🧩 Generate Quiz
--------------------------------------------------- */
export const generateQuiz = async (req, res) => {
  const { goal } = req.body;
  if (!goal)
    return res.status(400).json({ error: "Goal is required" });

  try {
    const prompt = `
      Create 3 multiple-choice questions to test someone's knowledge of "${goal}".
      Format JSON:
      [
        {"question": "...", "options": ["A", "B", "C", "D"], "answer": "A"},
        ...
      ]
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[.*\]/s);
    const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json({ questions });
  } catch (err) {
    console.error("❌ Quiz generation error:", err);

    // ✅ Fallback mock data (useful for dev/test)
    const questions = [
      {
        question: "Sample question 1",
        options: ["A", "B", "C", "D"],
        answer: "A",
      },
      {
        question: "Sample question 2",
        options: ["A", "B", "C", "D"],
        answer: "B",
      },
      {
        question: "Sample question 3",
        options: ["A", "B", "C", "D"],
        answer: "C",
      },
    ];
    res.json({ questions, note: "Using mock data due to API error" });
  }
};

/* ---------------------------------------------------
 🧠 Evaluate Quiz Answers
--------------------------------------------------- */
export const evaluateQuiz = async (req, res) => {
  const { goal, answers } = req.body;
  if (!goal || !answers)
    return res.status(400).json({ error: "Goal and answers required" });

  try {
    const prompt = `
      Based on these answers ${JSON.stringify(answers)} to a ${goal} quiz,
      decide whether the user is a "beginner", "intermediate", or "expert".
      Respond only with one word.
    `;

    const result = await model.generateContent(prompt);
    const level = result.response.text().trim().toLowerCase();

    res.json({ level });
  } catch (err) {
    console.error("❌ Evaluation failed:", err);
    res.status(500).json({ error: "Evaluation failed" });
  }
};

/* ---------------------------------------------------
 📦 Fetch user roadmaps
--------------------------------------------------- */
export const getUserRoadmaps = async (req, res) => {
  try {
    const { userId } = req.params;
    const roadmaps = await Roadmap.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(roadmaps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user roadmaps" });
  }
};

/* ---------------------------------------------------
 💾 Save Roadmap
--------------------------------------------------- */
export const saveRoadmap = async (req, res) => {
  const { userId, goal, steps } = req.body;
  if (!userId || !goal || !steps || !steps.length)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const roadmap = new Roadmap({ userId, goal, steps });
    await roadmap.save();
    res.json({ message: "Roadmap saved", roadmap });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save roadmap" });
  }
};
