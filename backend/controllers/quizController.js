import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("✅✅✅ RELOADING CONTROLLER - v2 ✅✅✅");
// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// ✅ Use the corrected model name
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/* ----------------------- Generate Quiz ----------------------- */
export const generateQuiz = async (req, res) => {
  const { goal } = req.body;
  if (!goal) return res.status(400).json({ error: "Goal is required" });

  try {
    // ✅ Updated prompt for cleaner, JSON-only output
    const prompt = `
      Create 5 multiple-choice questions for "${goal}".
      Format as a valid JSON array.
      
      Respond ONLY with the raw JSON array, starting with [ and ending with ].
      Do not include any other text, explanations, or markdown fences.
      
      Example format:
      [
        {"question": "...", "options": ["A", "B", "C", "D"], "answer": "A"},
        ...
      ]
    `;

    // Generate using Gemini
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // ✅ Robust parsing logic
    // 1. Clean markdown fences and whitespace
    const cleanedText = text
      .replace(/```json/g, "") // Remove ```json prefix
      .replace(/```/g, "")       // Remove ``` suffix
      .trim();                  // Remove leading/trailing whitespace

    // 2. Parse the cleaned text
    const questions = JSON.parse(cleanedText); 

    res.json({ questions });
  } catch (err) {
    // This will now catch API errors and JSON.parse errors
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