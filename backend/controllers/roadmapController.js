import OpenAI from "openai";
import dotenv from "dotenv";
import Roadmap from "../models/roadmapModel.js";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧭 Generate AI Roadmap
export const generateRoadmap = async (req, res) => {
  const { goal, level } = req.body;
  try {
    const prompt = `
      Generate a personalized career roadmap for someone who wants to "${goal}".
      Their skill level is "${level}".
      Include title, description, and estimated time for each step.
      Output as a JSON array:
      [
        {"title": "...", "description": "...", "estimatedTime": "..."},
        ...
      ]
    `;

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      text: { format: "text" }, // ✅ plain text output
    });

    let steps = [];
    try {
      steps = JSON.parse(completion.output[0].content[0].text);
    } catch (err) {
      console.error("Failed to parse JSON from model:", err);
    }

    res.json({ steps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate roadmap" });
  }
};

// 🧩 Generate Quiz
export const generateQuiz = async (req, res) => {
  const { goal } = req.body;
  try {
    const prompt = `
      Create 3 multiple-choice questions to test someone's knowledge of "${goal}".
      Return JSON array format:
      [
        {"question": "...", "options": ["A", "B", "C", "D"], "answer": "A"},
        ...
      ]
    `;

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      text: { format: "text" }, // ✅ plain text output
    });

    let questions = [];
    try {
      questions = JSON.parse(completion.output[0].content[0].text);
    } catch (err) {
      console.error("Failed to parse quiz JSON:", err);
    }

    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Quiz generation failed" });
  }
};

// 🧠 Evaluate Quiz Answers
export const evaluateQuiz = async (req, res) => {
  const { goal, answers } = req.body;
  try {
    const prompt = `
      Based on these answers ${JSON.stringify(answers)} to a ${goal} quiz,
      decide whether the user is a "beginner", "intermediate", or "expert".
      Respond only with one word.
    `;

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const level = completion.output[0].content[0].text.trim().toLowerCase();
    res.json({ level });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Evaluation failed" });
  }
};

// Fetch user roadmaps
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

// Save roadmap
export const saveRoadmap = async (req, res) => {
  const { userId, goal, steps } = req.body;

  if (!userId || !goal || !steps || !steps.length) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const roadmap = new Roadmap({ userId, goal, steps });
    await roadmap.save();
    res.json({ message: "Roadmap saved successfully", roadmap });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save roadmap" });
  }
};
