import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import Roadmap from "../models/roadmapModel.js";

// ENHANCEMENT: Initialize Gemini with JSON mode for reliable, structured output
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const jsonModel = genAI.getGenerativeModel({
  // ENHANCEMENT: Corrected model name to a valid and powerful option
  model: "gemini-2.5-flash",
  generationConfig: {
    response_mime_type: "application/json",
  },
});
const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


export const generateRoadmap = async (req, res) => {
  try {
    const { career, level } = req.body;

    if (!career || !level) {
      return res.status(400).json({ message: "Career and level are required" });
    }

    const prompt = `
Generate a detailed, structured career roadmap for becoming a successful ${career}.
The user is currently at a ${level} level.
Include 4–6 key phases, each with:
- phase name
- short description
- estimated duration (in months)
- essential skills
- recommended resources (courses, websites, or tools)

Return the result strictly as a JSON array. Example format:
[
  {
    "phase": "Foundation",
    "description": "Learn the basics...",
    "duration": "3 months",
    "skills": ["Skill1", "Skill2"],
    "resources": ["link1", "link2"]
  }
]
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Remove markdown formatting if present
    const cleaned = text.replace(/```json|```/g, "").trim();
    const roadmap = JSON.parse(cleaned);

    res.status(200).json({ roadmap });
  } catch (error) {
    console.error("❌ Roadmap generation error:", error);
    res.status(500).json({ message: "Error generating roadmap", error: error.message });
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
      You are a helpful quiz generator.
      Create exactly 5 multiple-choice questions to test a user's basic knowledge of "${goal}".
      
      Your response MUST be a valid JSON array of objects.
      Each object must have the keys: "question", "options" (an array of 4 strings), and "answer" (a string that exactly matches one of the options).
    `;

    const result = await jsonModel.generateContent(prompt);
    const questions = JSON.parse(result.response.text());

    res.json({ questions });
  } catch (err) {
    console.error("❌ Quiz generation error:", err);

    // ENHANCEMENT: Only use mock data in a development environment.
    if (process.env.NODE_ENV === 'development') {
      const mockQuestions = [
        { question: "Sample question 1 for dev", options: ["A", "B", "C", "D"], answer: "A" },
        { question: "Sample question 2 for dev", options: ["A", "B", "C", "D"], answer: "B" },
      ];
      return res.json({ questions: mockQuestions, note: "Using mock data due to API error" });
    }

    res.status(500).json({ error: "Failed to generate quiz." });
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
      Based on these user answers: ${JSON.stringify(answers)} for a quiz about "${goal}",
      evaluate if the user's skill level is "beginner", "intermediate", or "expert".
      
      Respond with ONLY one of those three words, nothing else.
    `;
    
    // Using the text model here since we only need a single word
    const result = await textModel.generateContent(prompt);
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
    // .lean() is a small performance optimization for read-only queries
    const roadmaps = await Roadmap.find({ userId }).sort({ createdAt: -1 }).lean();
    res.status(200).json(roadmaps);
  } catch (err) {
    console.error("❌ Fetch user roadmaps failed:", err);
    res.status(500).json({ message: "Failed to fetch user roadmaps" });
  }
};

/* ---------------------------------------------------
 💾 Save Roadmap
--------------------------------------------------- */
export const saveRoadmap = async (req, res) => {
  const { userId, goal, steps } = req.body;
  if (!userId || !goal || !steps || !steps.length)
    return res.status(400).json({ error: "Missing required fields for saving roadmap" });

  try {
    const roadmap = new Roadmap({ userId, goal, steps });
    await roadmap.save();
    res.status(201).json({ message: "Roadmap saved successfully", roadmap });
  } catch (err) {
    console.error("❌ Save roadmap failed:", err);
    res.status(500).json({ error: "Failed to save roadmap" });
  }
};