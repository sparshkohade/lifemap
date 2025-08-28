import express from "express";
const router = express.Router();

// Example static AI-like questions (replace with real OpenAI/Groq API later)
const sampleQuestions = [
  {
    question: "How comfortable are you with coding algorithms?",
    options: ["I’ve never coded before", "I know basics", "I solve medium problems", "I’m advanced"],
    weights: [0, 2, 4, 6],
  },
  {
    question: "How often do you practice coding?",
    options: ["Never", "Occasionally", "Weekly", "Daily"],
    weights: [0, 1, 3, 5],
  },
  {
    question: "How familiar are you with databases?",
    options: ["Not at all", "Basic SQL", "Good with queries", "Advanced (optimization, indexing)"],
    weights: [0, 2, 4, 6],
  },
];

router.get("/next", (req, res) => {
  // Pick a random question each time (to avoid repetition you can track sent ones)
  const randomQ = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
  res.json(randomQ);
});

export default router;
