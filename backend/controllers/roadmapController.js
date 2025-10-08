import OpenAI from "openai";
import dotenv from "dotenv";
import Roadmap from "../models/roadmapModel.js";

dotenv.config();

const client = new OpenAI({
  apiKey: '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',
});

// 🧭 Generate AI Roadmap
export const generateRoadmap = async (req, res) => {
  const { goal, level } = req.body;
  try {
    const prompt = `
    Generate a personalized career roadmap for someone who wants to "${goal}".
    Their skill level is "${level}".
    Include title, description, and estimated time for each step.
    Output JSON array format:
    [
      {"title": "...", "description": "...", "estimatedTime": "..."},
      ...
    ]
    `;
    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      response_format: { type: "json" },
    });

    const steps = JSON.parse(completion.output[0].content[0].text);
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
    Return JSON format:
    [
      {"question": "...", "options": ["A", "B", "C", "D"], "answer": "A"},
      ...
    ]
    `;
    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      response_format: { type: "json" },
    });
    const questions = JSON.parse(completion.output[0].content[0].text);
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