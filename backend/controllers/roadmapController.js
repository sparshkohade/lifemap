import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import Roadmap from "../models/roadmapModel.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// create models once and reuse
const jsonModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { response_mime_type: "application/json" },
});
const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Helper: safely extract text content from the various possible SDK shapes.
 * Tries (in order):
 *  - result.response.text() if available
 *  - result.output[0].content[0].text
 *  - fallback to JSON.stringify(result)
 */
const extractModelText = (result) => {
  try {
    if (!result) return "";
    // Common new SDK pattern
    if (typeof result.response?.text === "function") {
      const t = result.response.text();
      if (typeof t === "string") return t;
      // some SDKs return Promise-like; guard below
    }
    // Some SDKs return a plain string at response.text (non-function)
    if (typeof result.response?.text === "string") return result.response.text;

    // Another common pattern
    const alt = result?.output?.[0]?.content?.[0]?.text;
    if (typeof alt === "string") return alt;

    // Final fallback
    return JSON.stringify(result);
  } catch (err) {
    console.error("extractModelText error:", err);
    return "";
  }
};

/**
 * Helper: find first JSON object/array inside a string (handles fenced blocks)
 */
const extractFirstJson = (str) => {
  if (!str || typeof str !== "string") return null;

  // remove ```json or ``` fences
  const cleaned = str.replace(/```(?:json)?/gi, "```").trim();

  // Try to find a JSON block inside fences first
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (e) {
      // fallthrough to regex searching
    }
  }

  // Try to extract first {...} or [...] block using regex (greedy bracket matching is hard, do simple approach)
  // We'll attempt balanced-paren style parsing for top-level braces/brackets.
  const firstChar = cleaned.search(/[\[\{]/);
  if (firstChar === -1) return null;

  // Attempt incremental parse for arrays or objects
  for (let i = firstChar; i < cleaned.length; i++) {
    const candidate = cleaned.slice(firstChar, i + 1);
    try {
      const parsed = JSON.parse(candidate);
      // parsed successfully
      return parsed;
    } catch (e) {
      // keep going
    }
  }

  // final attempt: try parsing the whole cleaned string
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
};

const ensureArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);

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

    const result = await jsonModel.generateContent(prompt);
    const rawText = extractModelText(result);
    let roadmap = extractFirstJson(rawText);

    if (!roadmap) {
      // If parsing failed, try a looser strategy: remove lines that start with "1." or "-" and then extract JSON
      const fallbackText = rawText.replace(/^[\s\-\d\.\)]+/gm, "");
      roadmap = extractFirstJson(fallbackText);
    }

    if (!roadmap) {
      console.error("❌ Could not parse roadmap JSON. Raw response:", rawText);
      return res.status(500).json({ message: "Failed to parse roadmap from model response" });
    }

    // Basic validation: must be an array with objects having expected keys
    if (!Array.isArray(roadmap) || roadmap.length < 1) {
      return res.status(500).json({ message: "Roadmap must be a non-empty JSON array" });
    }

    // Normalize small schema issues
    roadmap = roadmap.map((p) => ({
      phase: p.phase || p.name || p.title || "Unnamed phase",
      description: p.description || p.desc || p.summary || "",
      duration: p.duration || p.estimated_duration || p.timeframe || "",
      skills: ensureArray(p.skills || p.essential_skills || p.skills_list),
      resources: ensureArray(p.resources || p.recommended_resources || p.links),
    }));

    res.status(200).json({ roadmap });
  } catch (error) {
    console.error("❌ Roadmap generation error:", error);
    res.status(500).json({ message: "Error generating roadmap", error: error.message || error.toString() });
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
    const rawText = extractModelText(result);
    let questions = extractFirstJson(rawText);

    if (!questions || !Array.isArray(questions)) {
      console.warn("Quiz parse fallback. Raw:", rawText);
      // try looser parse
      // (maybe the model returned an object with a `questions` field)
      const maybe = extractFirstJson(`{ "maybe": ${rawText} }`);
      if (maybe?.maybe && Array.isArray(maybe.maybe)) questions = maybe.maybe;
    }

    // Validate and sanitize
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new Error("Model did not return a valid quiz array");
    }

    // Normalize items and ensure exactly 5 questions (if model returned more/less)
    questions = questions.slice(0, 5).map((q, idx) => {
      const question = q.question || q.q || q.prompt || `Question ${idx + 1}`;
      const options = Array.isArray(q.options) ? q.options.slice(0, 4) : ensureArray(q.options).slice(0, 4);
      // If answer exists ensure it matches one option; else set to first option
      const answer = (typeof q.answer === "string" && options.includes(q.answer)) ? q.answer : (options[0] || "");
      return { question, options, answer };
    });

    // If fewer than 5 after sanitization, pad with simple dev questions (rare)
    if (questions.length < 5) {
      while (questions.length < 5) {
        questions.push({ question: "Placeholder question", options: ["A", "B", "C", "D"], answer: "A" });
      }
    }

    res.json({ questions });
  } catch (err) {
    console.error("❌ Quiz generation error:", err);

    if (process.env.NODE_ENV === 'development') {
      const mockQuestions = [
        { question: "Sample question 1 for dev", options: ["A", "B", "C", "D"], answer: "A" },
        { question: "Sample question 2 for dev", options: ["A", "B", "C", "D"], answer: "B" },
        { question: "Sample question 3 for dev", options: ["A", "B", "C", "D"], answer: "C" },
        { question: "Sample question 4 for dev", options: ["A", "B", "C", "D"], answer: "D" },
        { question: "Sample question 5 for dev", options: ["A", "B", "C", "D"], answer: "A" },
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

    const result = await textModel.generateContent(prompt);
    let raw = extractModelText(result).trim().toLowerCase();

    // Extract first word that matches allowed levels
    const allowed = ["beginner", "intermediate", "expert"];
    let level = allowed.find(l => raw.includes(l)) || "";

    // Defensive fallback: if the model returned a sentence, try to isolate the first token
    if (!level) {
      const firstToken = raw.split(/\s+/)[0].replace(/[^a-z]/g, "");
      if (allowed.includes(firstToken)) level = firstToken;
    }

    if (!level) {
      console.warn("Evaluation ambiguous. Raw model output:", raw);
      // fallback to 'beginner' as safe default (or return 500); choose safer behavior
      level = "beginner";
    }

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
