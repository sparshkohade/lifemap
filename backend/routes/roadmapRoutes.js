// backend/routes/roadmapRoutes.js
import express from "express";

const router = express.Router();

/**
 * Simple heuristic generator for demo/dev usage.
 * In production, replace with real generation logic (AI, DB, templates).
 */
function generateDemoRoadmap({ career = "Full Stack Developer", level = "beginner" } = {}) {
  const baseSteps = [
    {
      title: "Foundation: CS & JavaScript",
      description: "Learn programming fundamentals, JavaScript basics, and developer tooling.",
      estimatedTime: "4-8 weeks",
      substeps: ["Variables, control flow, functions", "DOM & basic web APIs", "Git & CLI basics"],
      progress: 10,
    },
    {
      title: "Frontend: HTML, CSS, React",
      description: "Build modern UIs with React and component-based architecture.",
      estimatedTime: "6-10 weeks",
      substeps: ["Semantic HTML & responsive CSS", "React fundamentals", "State management (context/hooks)"],
      progress: 30,
    },
    {
      title: "Backend: Node.js & Databases",
      description: "APIs, persistence, and server-side concepts using Node and MongoDB.",
      estimatedTime: "6-10 weeks",
      substeps: ["Express APIs", "MongoDB basics & Mongoose", "Authentication & authorization"],
      progress: 55,
    },
    {
      title: "Deployment & DevOps basics",
      description: "Deploy apps, manage environments, CI/CD basics, and cloud fundamentals.",
      estimatedTime: "3-6 weeks",
      substeps: ["Docker basics", "Deploy to Heroku / Vercel / AWS", "CI pipeline (GitHub Actions)"],
      progress: 75,
    },
    {
      title: "Portfolio & Interview Prep",
      description: "Polish projects, prepare for interviews and system design basics.",
      estimatedTime: "2-6 weeks",
      substeps: ["Build 2-3 portfolio projects", "DSA practice", "Mock interviews"],
      progress: 95,
    },
  ];

  // small adjustments by level
  if (level === "intermediate") {
    baseSteps[0].estimatedTime = "2-4 weeks";
    baseSteps[1].estimatedTime = "4-8 weeks";
  } else if (level === "expert") {
    baseSteps[0].estimatedTime = "1-2 weeks";
    baseSteps[1].estimatedTime = "2-4 weeks";
    baseSteps[2].estimatedTime = "3-6 weeks";
  }

  return {
    career,
    level,
    generatedAt: new Date().toISOString(),
    roadmap: baseSteps,
  };
}

/**
 * Local keyword -> suggestion mapping (fallback).
 * You can extend these to call external APIs or a DB of curated resources.
 */
function recommendationsForTopic(topic = "") {
  const t = (topic || "").toLowerCase();
  const out = [];

  function push(title, provider, type = "course", url = null) {
    out.push({ title, provider, type, url });
  }

  if (/react|frontend|ui|html|css/.test(t)) {
    push("Modern React with Redux", "Udemy", "course", "https://www.udemy.com/");
    push("Meta Front-End Developer Professional Certificate", "Coursera", "certification", "https://www.coursera.org/");
    push("CSS - The Complete Guide", "Udemy", "course", "https://www.udemy.com/");
  }

  if (/node|backend|express|api/.test(t)) {
    push("The Complete Node.js Developer Course", "Udemy", "course", "https://www.udemy.com/");
    push("Node.js, Express, MongoDB & More: The Complete Bootcamp", "Udemy", "course", "https://www.udemy.com/");
  }

  if (/mongo|database|sql|nosql/.test(t)) {
    push("MongoDB Basics", "MongoDB University", "course", "https://university.mongodb.com/");
    push("MongoDB Certified Developer Associate", "MongoDB", "certification", "https://www.mongodb.com/");
  }

  if (/aws|cloud|devops|deployment|docker/.test(t)) {
    push("AWS Certified Solutions Architect – Associate", "AWS", "certification", "https://aws.amazon.com/certification/");
    push("Docker for Developers", "Udemy", "course", "https://www.udemy.com/");
  }

  if (/ml|machine|ai|tensorflow|pytorch/.test(t)) {
    push("Machine Learning (Andrew Ng)", "Coursera", "course", "https://www.coursera.org/learn/machine-learning");
    push("TensorFlow Developer Certificate", "TensorFlow", "certification", "https://www.tensorflow.org/certificate");
  }

  // fallback
  if (!out.length) {
    push("Data Structures & Algorithms (self-paced)", "Coursera / GeeksforGeeks", "course");
    push("Professional Portfolio & Interview Prep", "Coursera / Udacity", "course");
  }

  return out;
}

/**
 * POST /api/roadmaps/generate
 * Body: { career, level }  (optional)
 * Returns an example generated roadmap (replace with your generation logic).
 */
router.post("/generate", (req, res) => {
  const { career, level } = req.body || {};
  const data = generateDemoRoadmap({ career: career || "Full Stack Developer", level: level || "beginner" });
  return res.status(200).json(data);
});

/**
 * POST /api/roadmaps/recommendations
 * Body: { topic: string }
 * Returns curated suggestions for courses/certifications.
 */
router.post("/recommendations", (req, res) => {
  const topic = (req.body && req.body.topic) || "";
  const suggestions = recommendationsForTopic(topic);
  return res.status(200).json({ topic, suggestions });
});

/**
 * GET /api/roadmaps/latest
 * Optional: return a demo roadmap for the chart when user hasn't generated one yet.
 */
router.get("/latest", (_req, res) => {
  const demo = generateDemoRoadmap();
  return res.status(200).json(demo.roadmap || demo);
});

export default router;
