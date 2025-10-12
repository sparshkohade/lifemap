import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/* ----------------------- Generate Quiz ----------------------- */
export const generateQuiz = async (req, res) => {
  const { goal } = req.body;
  if (!goal) return res.status(400).json({ error: "Goal is required" });

  try {
    const prompt = `
      Create 5 multiple-choice questions for "${goal}".
      Format JSON:
      [
        {"question": "...", "options": ["A", "B", "C", "D"], "answer": "A"},
        ...
      ]
    `;

    // Generate using Gemini
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Try parsing JSON safely
    const jsonMatch = text.match(/\[.*\]/s); // extract JSON if model adds extra text
    const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json({ questions });
  } catch (err) {
    console.error("❌ Quiz generation failed:", err);
    res.status(500).json({ error: "Quiz generation failed" });
  }
};

/* ----------------------- Evaluate Quiz ----------------------- */
export const evaluateQuiz = async (req, res) => {
  const { goal, answers } = req.body;
  if (!goal || !answers)
    return res.status(400).json({ error: "Goal and answers required" });

  try {
    const prompt = `
      Based on these answers ${JSON.stringify(
        answers
      )} for a ${goal} quiz,
      determine skill level: "beginner", "intermediate", or "expert".
      Respond with a single word.
    `;

    // Generate using Gemini
    const result = await model.generateContent(prompt);
    const level = result.response.text().trim().toLowerCase();

    res.json({ level });
  } catch (err) {
    console.error("❌ Evaluation failed:", err);
    res.status(500).json({ error: "Evaluation failed" });
  }
};
