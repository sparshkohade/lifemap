// backend/controllers/roadmapController.js
import dotenv from "dotenv";
dotenv.config();

import Roadmap from "../models/roadmapModel.js";
import { roadmapToGantt } from "../utils/gantt.js";
import mongoose from "mongoose";

// Optional: if you use Google Generative API, keep these imports
// Make sure GEMINI_API_KEY is set or guard the usage if it's missing.
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Helper: ensure value is array
const ensureArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

/* ------------------------------------------------------------------
   NEW helpers for detailed meta/nodes/edges roadmap
-------------------------------------------------------------------*/
const makeId = (p = "") => p + Math.random().toString(36).slice(2, 9);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const node = ({ id, type = "topic", title, description = "", durationDays = 7, tags = [], subtitle = "", startOffsetDays = null, endOffsetDays = null, visual = {} }) => ({
  id, type, title, subtitle, description, durationDays, tags, startOffsetDays, endOffsetDays, visual,
});
const edge = (from, to, type = "solid", label = "") => ({ id: `e_${from}_${to}`, from, to, type, label });

/* ------------------------------------------------------------------
   Node details endpoint (used by frontend when clicking a node)
   Returns: { id, label, videos, certifications, resources }
-------------------------------------------------------------------*/
export const getNodeDetails = async (req, res) => {
  try {
    const rawId = req.params.id || "";
    // decode possible encoded label (preserves spaces & special chars)
    const label = decodeURIComponent(rawId).replace(/\+/g, " ").trim();
    const lower = label.toLowerCase();

    const videos = [];
    const certifications = [];
    const resources = [];

    // Expand this mapping as you like
    if (/html/.test(lower)) {
      videos.push({ title: "HTML Crash Course", url: "https://www.youtube.com/watch?v=UB1O30fR-EE", channel: "Traversy Media" });
      certifications.push({ title: "HTML Basics - Codecademy", provider: "Codecademy", url: "https://www.codecademy.com" });
      resources.push({ title: "MDN HTML Reference", url: "https://developer.mozilla.org/en-US/docs/Web/HTML" });
    } else if (/css|tailwind/.test(lower)) {
      videos.push({ title: "CSS Crash Course", url: "https://www.youtube.com/watch?v=yfoY53QXEnI", channel: "Traversy Media" });
      certifications.push({ title: "Responsive Web Design", provider: "freeCodeCamp", url: "https://www.freecodecamp.org" });
      resources.push({ title: "MDN CSS Reference", url: "https://developer.mozilla.org/en-US/docs/Web/CSS" });
    } else if (/react/.test(lower)) {
      videos.push({ title: "React Tutorial for Beginners", url: "https://reactjs.org/tutorial/tutorial.html", channel: "React" });
      certifications.push({ title: "React - Frontend Development", provider: "Coursera", url: "https://www.coursera.org" });
      resources.push({ title: "React Official Docs", url: "https://reactjs.org" });
    } else if (/node|express/.test(lower)) {
      videos.push({ title: "Node.js Crash Course", url: "https://www.youtube.com/watch?v=fBNz5xF-Kx4", channel: "Traversy Media" });
      certifications.push({ title: "The Complete Node.js Developer Course", provider: "Udemy", url: "https://www.udemy.com" });
      resources.push({ title: "Node.js Docs", url: "https://nodejs.org/en/docs/" });
    } else if (/aws|ec2|s3|route53|vpc/.test(lower)) {
      videos.push({ title: "AWS for Beginners", url: "https://www.youtube.com/watch?v=3hLmDS179YE", channel: "FreeCodeCamp" });
      certifications.push({ title: "AWS Certified Solutions Architect – Associate", provider: "AWS", url: "https://aws.amazon.com/certification/" });
      resources.push({ title: "AWS Docs", url: "https://docs.aws.amazon.com/" });
    } else {
      // generic fallback suggestions
      videos.push({ title: `${label} — Intro (placeholder)`, url: "https://www.youtube.com", channel: "YouTube" });
      certifications.push({ title: `${label} Fundamentals (placeholder)`, provider: "Coursera", url: "https://www.coursera.org" });
      resources.push({ title: "MDN / Reference", url: "https://developer.mozilla.org/" });
    }

    return res.json({ id: rawId, label, videos, certifications, resources });
  } catch (err) {
    console.error("getNodeDetails error:", err);
    return res.status(500).json({ error: "Failed to lookup node details" });
  }
};

/* ----------------------------
   Demo generator & recommendations
   ---------------------------- */
export const generateDemoRoadmap = (req, res) => {
  const { career = "Full Stack Developer", level = "beginner" } = req.body || {};

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

  // level adjustments
  if (level === "intermediate") {
    baseSteps[0].estimatedTime = "2-4 weeks";
    baseSteps[1].estimatedTime = "4-8 weeks";
  } else if (level === "expert") {
    baseSteps[0].estimatedTime = "1-2 weeks";
    baseSteps[1].estimatedTime = "2-4 weeks";
    baseSteps[2].estimatedTime = "3-6 weeks";
  }

  return res.json({
    career,
    level,
    generatedAt: new Date().toISOString(),
    roadmap: baseSteps,
  });
};

export const recommendations = (req, res) => {
  const topic = (req.body && req.body.topic) || "";
  const t = topic.toLowerCase();
  const out = [];
  const push = (title, provider, type = "course", url = null) => out.push({ title, provider, type, url });

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

  if (!out.length) {
    push("Data Structures & Algorithms (self-paced)", "Coursera / GeeksforGeeks", "course");
    push("Professional Portfolio & Interview Prep", "Coursera / Udacity", "course");
  }

  return res.json({ topic, suggestions: out });
};

export const latestDemo = (_req, res) => {
  // reuse demo generator with defaults
  const demo = {
    career: "Full Stack Developer",
    level: "beginner",
    generatedAt: new Date().toISOString(),
    roadmap: [
      { title: "Foundation", description: "Basics", estimatedTime: "4-8 weeks" },
      { title: "Frontend", description: "React & UI", estimatedTime: "6-10 weeks" },
    ],
  };
  return res.json(demo);
};

/* ----------------------------
   CRUD: create/get/update/delete
   ---------------------------- */
export const createRoadmap = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      user: req.user && (req.user.id || req.user._id),
    };
    const roadmap = await Roadmap.create(payload);
    return res.status(201).json(roadmap);
  } catch (err) {
    console.error("createRoadmap error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const getRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id).lean();
    if (!roadmap) return res.status(404).json({ error: "Roadmap not found" });
    return res.json(roadmap);
  } catch (err) {
    console.error("getRoadmap error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const updateRoadmap = async (req, res) => {
  try {
    const updated = await Roadmap.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return res.status(404).json({ error: "Roadmap not found" });
    return res.json(updated);
  } catch (err) {
    console.error("updateRoadmap error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const deleteRoadmap = async (req, res) => {
  try {
    const deleted = await Roadmap.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: "Roadmap not found" });
    return res.json({ success: true, deletedId: req.params.id });
  } catch (err) {
    console.error("deleteRoadmap error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* ----------------------------
   Gantt
   ---------------------------- */
export const getGanttData = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id).lean();
    if (!roadmap) return res.status(404).json({ error: "Roadmap not found" });
    const tasks = roadmapToGantt(roadmap);
    return res.json({ tasks });
  } catch (err) {
    console.error("getGanttData error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* ----------------------------
   Quiz generation & evaluation
   ---------------------------- */
/* (unchanged - preserved from your file) */
const extractModelText = (result) => {
  try {
    if (!result) return "";
    if (typeof result.response?.text === "function") {
      const t = result.response.text();
      if (typeof t === "string") return t;
    }
    if (typeof result.response?.text === "string") return result.response.text;
    const alt = result?.output?.[0]?.content?.[0]?.text;
    if (typeof alt === "string") return alt;
    return JSON.stringify(result);
  } catch (err) {
    console.error("extractModelText error:", err);
    return "";
  }
};

const extractFirstJson = (str) => {
  if (!str || typeof str !== "string") return null;
  const cleaned = str.replace(/```(?:json)?/gi, "```").trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (e) {}
  }
  const firstChar = cleaned.search(/[\[\{]/);
  if (firstChar === -1) return null;
  for (let i = firstChar; i < cleaned.length; i++) {
    const candidate = cleaned.slice(firstChar, i + 1);
    try {
      const parsed = JSON.parse(candidate);
      return parsed;
    } catch (e) {}
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
};

/* ------------------------------------------------------------------
   REWRITTEN: generateRoadmap -> returns meta/nodes/edges (20+ nodes)
   Scales to user timeline via timelineUnits + timelineLength
-------------------------------------------------------------------*/
export const generateRoadmap = async (req, res) => {
  try {
    const {
      career = "Full Stack Developer",
      level = "beginner",
      timelineUnits = "months",    // "days" | "weeks" | "months"
      timelineLength = 6          // e.g. 6 months
    } = req.body || {};

    // Convert requested timeline to approximate total days
    const unitToDays = { days: 1, weeks: 7, months: 30, year: 365, years: 365 };
    const totalDays = clamp(
      (unitToDays[String(timelineUnits).toLowerCase()] || 30) * (parseInt(timelineLength, 10) || 6),
      30,
      3650
    );

    // Try model first (kept for future), but fall back to our deterministic structure
    if (genAI) {
      try {
        const prompt = `
You are an assistant that MUST return ONLY JSON (no prose). Produce a timeline/flow roadmap for a learner pursuing the career goal: ${career}. The output must be a JSON object with these top-level fields:

{
  "meta": { "title": "...", "startDate": "YYYY-MM-DD", "totalDays": number },
  "nodes": [
    {
      "id": "unique-id",
      "type": "topic" | "checkpoint" | "group" | "milestone",
      "title": "Short title",
      "subtitle": "Optional small subtitle",
      "description": "One-sentence description",
      "durationDays": number,
      "progress": number,
      "tags": ["frontend","backend","devops"],
      "visual": { "color":"#fff", "shape":"rect" },
      "startOffsetDays": number,
      "endOffsetDays": number
    }
  ],
  "edges": [
    { "from": "node-id", "to": "node-id", "type": "solid" | "dashed" | "dependency", "label": "optional" }
  ]
}

Constraints:
- Produce at least 15 nodes.
- Include topics like HTML, CSS, JavaScript, npm, Git, GitHub, React, Tailwind, Node.js, REST APIs, PostgreSQL, Redis, JWT/Auth, Linux, AWS (EC2/S3/Route53/VPC/SES), Docker, GitHub Actions, Terraform, Ansible, Monit.
- Add checkpoints for Static Pages, Interactivity, External Packages, Frontend Apps, CLI Apps, Simple CRUD Apps, Complete App, Deployment, CI/CD, Monitoring, Automation, Infrastructure.
- Use durations and offsets that reasonably fill ${totalDays} days.
Return only JSON.
        `.trim();

        const model = genAI.getGenerativeModel?.({ model: "gemini-2.5-flash", generationConfig: { response_mime_type: "application/json" } });
        let result = null;
        if (model?.generateContent) result = await model.generateContent(prompt);
        else if (genAI.generateContent) result = await genAI.generateContent(prompt);

        const raw = extractModelText(result);
        const parsed = extractFirstJson(raw);
        if (parsed?.nodes?.length >= 12 && parsed?.edges?.length) {
          // ensure meta.totalDays is aligned
          parsed.meta = parsed.meta || {};
          parsed.meta.totalDays = totalDays;
          return res.status(200).json(parsed);
        }
      } catch (e) {
        console.warn("genAI roadmap failed, using deterministic fallback:", e?.message || e);
      }
    }

    // Deterministic detailed structure (inspired by your reference image)
    const startDate = new Date().toISOString().slice(0, 10);
    const unit = Math.max(3, Math.round(totalDays / 40)); // base duration unit
    const nodes = [];

    // Intro group
    const root = node({ id: makeId("root_"), type: "group", title: "Full Stack — Start", description: "Begin here", durationDays: 0 });

    // Frontend basics
    const nHTML = node({ id: makeId("n_"), title: "HTML", description: "Semantic tags, forms, a11y", durationDays: unit * 2, tags: ["frontend","basics"] });
    const nCSS = node({ id: makeId("n_"), title: "CSS", description: "Box model, Flexbox, Grid, responsive", durationDays: unit * 2, tags: ["frontend","basics"] });
    const cpStatic = node({ id: makeId("cp_"), type: "checkpoint", title: "Checkpoint — Static Webpages", description: "Multi-page static site", durationDays: unit, tags: ["checkpoint"] });

    const nJS = node({ id: makeId("n_"), title: "JavaScript", description: "ES6+, DOM, events, async", durationDays: unit * 4, tags: ["frontend","language"] });
    const cpInteractivity = node({ id: makeId("cp_"), type: "checkpoint", title: "Checkpoint — Interactivity", description: "Interactive UI widgets", durationDays: unit, tags: ["checkpoint"] });

    const nNPM = node({ id: makeId("n_"), title: "npm", description: "Packages, scripts, semver", durationDays: unit, tags: ["tools"] });
    const cpPackages = node({ id: makeId("cp_"), type: "checkpoint", title: "Checkpoint — External Packages", description: "Use third-party libs", durationDays: unit, tags: ["checkpoint"] });

    const nGitHub = node({ id: makeId("n_"), title: "GitHub", description: "PRs, Issues, collaboration", durationDays: unit, tags: ["tools"] });
    const nGit = node({ id: makeId("n_"), title: "Git", description: "Commits, branching, merging", durationDays: unit, tags: ["tools"] });
    const cpCollab = node({ id: makeId("cp_"), type: "checkpoint", title: "Checkpoint — Collaborative Work", description: "Team workflow", durationDays: unit, tags: ["checkpoint"] });

    const nReact = node({ id: makeId("n_"), title: "React", description: "Components, hooks, router", durationDays: unit * 6, tags: ["frontend","framework"] });
    const nTailwind = node({ id: makeId("n_"), title: "Tailwind CSS", description: "Utility-first styling", durationDays: unit, tags: ["frontend","styling"] });
    const cpFEApps = node({ id: makeId("cp_"), type: "checkpoint", title: "Checkpoint — Frontend Apps", description: "SPA with routing", durationDays: unit * 2, tags: ["checkpoint"] });

    // Backend
    const sepBackend = node({ id: makeId("group_"), type: "group", title: "Backend Starts Here", description: "", durationDays: 0 });
    const nNode = node({ id: makeId("n_"), title: "Node.js", description: "Runtime, modules, servers", durationDays: unit * 3, tags: ["backend"] });
    const cpCLI = node({ id: makeId("cp_"), type: "checkpoint", title: "Checkpoint — CLI Apps", description: "Small CLI tools", durationDays: unit, tags: ["checkpoint"] });
    const nREST = node({ id: makeId("n_"), title: "RESTful APIs", description: "Routing, validation, errors", durationDays: unit * 2, tags: ["backend","api"] });
    const nPostgres = node({ id: makeId("n_"), title: "PostgreSQL", description: "Modeling, CRUD, indexes", durationDays: unit * 2, tags: ["database"] });
    const cpCRUD = node({ id: makeId("cp_"), type: "checkpoint", title: "Checkpoint — Simple CRUD Apps", description: "CRUD API + DB", durationDays: unit * 2, tags: ["checkpoint"] });
    const nJWT = node({ id: makeId("n_"), title: "JWT Auth", description: "AuthN/AuthZ, sessions", durationDays: unit, tags: ["security"] });
    const nRedis = node({ id: makeId("n_"), title: "Redis", description: "Caching, sessions, pub/sub", durationDays: unit, tags: ["cache"] });
    const cpComplete = node({ id: makeId("cp_"), type: "checkpoint", title: "Checkpoint — Complete App", description: "Full stack app", durationDays: unit * 3, tags: ["checkpoint","project"] });

    // DevOps / Cloud
    const sepDevOps = node({ id: makeId("group_"), type: "group", title: "DevOps Starts Here", description: "", durationDays: 0 });
    const nLinux = node({ id: makeId("n_"), title: "Linux Basics", description: "Shell, processes, networking", durationDays: unit * 2, tags: ["devops"] });
    const nAWS = node({ id: makeId("n_"), title: "Basic AWS Services", description: "Core cloud services", durationDays: unit * 3, tags: ["cloud","aws"] });
    const nEC2 = node({ id: makeId("n_"), title: "EC2", description: "Compute & SSH", durationDays: unit, tags: ["aws"] });
    const nVPC = node({ id: makeId("n_"), title: "VPC", description: "Subnets, routing, security groups", durationDays: unit, tags: ["aws"] });
    const nS3 = node({ id: makeId("n_"), title: "S3", description: "Static hosting, storage", durationDays: unit, tags: ["aws"] });
    const nR53 = node({ id: makeId("n_"), title: "Route53", description: "DNS basics", durationDays: unit, tags: ["aws"] });
    const nSES = node({ id: makeId("n_"), title: "SES", description: "Transactional email", durationDays: unit, tags: ["aws"] });

    const cpDeploy = node({ id: makeId("cp_"), type: "checkpoint", title: "Checkpoint — Deployment", description: "Publicly deployed app", durationDays: unit * 2, tags: ["checkpoint"] });
    const cpCICD = node({ id: makeId("cp_"), type: "checkpoint", title: "Checkpoint — CI / CD", description: "Automated pipeline", durationDays: unit * 2, tags: ["checkpoint"] });
    const cpMonitor = node({ id: makeId("cp_"), type: "checkpoint", title: "Checkpoint — Monitoring", description: "Basic observability", durationDays: unit, tags: ["checkpoint"] });
    const cpAuto = node({ id: makeId("cp_"), type: "checkpoint", title: "Checkpoint — Automation", description: "Ops automation", durationDays: unit, tags: ["checkpoint"] });
    const cpInfra = node({ id: makeId("cp_"), type: "checkpoint", title: "Checkpoint — Infrastructure", description: "IaC foundations", durationDays: unit, tags: ["checkpoint"] });

    const nDocker = node({ id: makeId("n_"), title: "Docker", description: "Containerize apps", durationDays: unit * 2, tags: ["devops"] });
    const nGHA = node({ id: makeId("n_"), title: "GitHub Actions", description: "CI workflows", durationDays: unit * 2, tags: ["ci"] });
    const nMonit = node({ id: makeId("n_"), title: "Monit", description: "Service monitoring & alerts", durationDays: unit, tags: ["monitoring"] });
    const nTerraform = node({ id: makeId("n_"), title: "Terraform", description: "Infrastructure as code", durationDays: unit * 3, tags: ["infra"] });
    const nAnsible = node({ id: makeId("n_"), title: "Ansible", description: "Configuration management", durationDays: unit * 2, tags: ["infra"] });

    // Continue group
    const nContinue = node({ id: makeId("group_"), type: "group", title: "Continue Learning — Frontend / Backend / DevOps / AWS", description: "", durationDays: 0 });

    nodes.push(
      root,
      nHTML, nCSS, cpStatic,
      nJS, cpInteractivity,
      nNPM, cpPackages,
      nGit, nGitHub, cpCollab,
      nReact, nTailwind, cpFEApps,
      sepBackend, nNode, cpCLI, nREST, nPostgres, cpCRUD, nJWT, nRedis, cpComplete,
      sepDevOps, nLinux, nAWS, nEC2, nVPC, nS3, nR53, nSES,
      nDocker, nGHA, cpDeploy, cpCICD, nMonit, cpMonitor, cpAuto, nTerraform, nAnsible, cpInfra,
      nContinue
    );

    // Edges (mirroring your image’s flow)
    const edges = [];
    edges.push(edge(root.id, nHTML.id));
    edges.push(edge(nHTML.id, nCSS.id));
    edges.push(edge(nCSS.id, cpStatic.id));

    edges.push(edge(cpStatic.id, nJS.id));
    edges.push(edge(nJS.id, cpInteractivity.id));

    edges.push(edge(cpInteractivity.id, nNPM.id));
    edges.push(edge(nNPM.id, cpPackages.id));

    edges.push(edge(cpPackages.id, nGit.id));
    edges.push(edge(nGit.id, nGitHub.id));
    edges.push(edge(nGitHub.id, cpCollab.id));

    edges.push(edge(cpCollab.id, nReact.id));
    edges.push(edge(nReact.id, nTailwind.id));
    edges.push(edge(nTailwind.id, cpFEApps.id));

    edges.push(edge(cpFEApps.id, sepBackend.id, "dashed", "Start Backend"));
    edges.push(edge(sepBackend.id, nNode.id));
    edges.push(edge(nNode.id, cpCLI.id));
    edges.push(edge(cpCLI.id, nREST.id));
    edges.push(edge(nREST.id, nPostgres.id));
    edges.push(edge(nPostgres.id, cpCRUD.id));
    edges.push(edge(cpCRUD.id, nJWT.id));
    edges.push(edge(nJWT.id, nRedis.id));
    edges.push(edge(nRedis.id, cpComplete.id));

    edges.push(edge(cpComplete.id, sepDevOps.id, "dashed", "DevOps starts"));
    edges.push(edge(sepDevOps.id, nLinux.id));
    edges.push(edge(nLinux.id, nAWS.id));
    edges.push(edge(nAWS.id, nEC2.id));
    edges.push(edge(nAWS.id, nVPC.id));
    edges.push(edge(nAWS.id, nS3.id));
    edges.push(edge(nAWS.id, nR53.id));
    edges.push(edge(nAWS.id, nSES.id));

    edges.push(edge(cpComplete.id, nDocker.id));
    edges.push(edge(nDocker.id, nGHA.id));
    edges.push(edge(nGHA.id, cpDeploy.id));
    edges.push(edge(cpDeploy.id, cpCICD.id));
    edges.push(edge(cpCICD.id, nMonit.id));
    edges.push(edge(nMonit.id, cpMonitor.id));

    edges.push(edge(cpMonitor.id, cpAuto.id));
    edges.push(edge(cpAuto.id, nTerraform.id));
    edges.push(edge(nTerraform.id, nAnsible.id));
    edges.push(edge(nAnsible.id, cpInfra.id));

    edges.push(edge(cpInfra.id, nContinue.id, "dashed"));

    // simple linear offsets (frontend ~35%, backend ~35%, devops/cloud ~30%)
    const assignOffsets = (arr) => {
      let day = 0;
      for (const nd of arr) {
        if (nd.type === "group") { nd.startOffsetDays = day; nd.endOffsetDays = day; continue; }
        nd.startOffsetDays = day;
        nd.endOffsetDays = day + (nd.durationDays || unit);
        day = nd.endOffsetDays;
      }
    };
    assignOffsets([
      nHTML, nCSS, cpStatic,
      nJS, cpInteractivity,
      nNPM, cpPackages,
      nGit, nGitHub, cpCollab,
      nReact, nTailwind, cpFEApps
    ]);
    assignOffsets([
      nNode, cpCLI, nREST, nPostgres, cpCRUD, nJWT, nRedis, cpComplete
    ]);
    assignOffsets([
      nLinux, nAWS, nEC2, nVPC, nS3, nR53, nSES,
      nDocker, nGHA, cpDeploy, cpCICD, nMonit, cpMonitor, cpAuto, nTerraform, nAnsible, cpInfra
    ]);

    // meta
    const meta = { title: `${career} Roadmap`, startDate, totalDays, level };

    return res.status(200).json({ meta, nodes, edges });
  } catch (err) {
    console.error("generateRoadmap error:", err);
    return res.status(500).json({ message: "Error generating roadmap", error: err.message || String(err) });
  }
};

export const generateQuiz = async (req, res) => {
  const { goal } = req.body;
  if (!goal) return res.status(400).json({ error: "Goal is required" });

  try {
    if (!genAI) {
      // dev fallback
      const mockQuestions = [
        { question: "Sample question 1 for dev", options: ["A", "B", "C", "D"], answer: "A" },
        { question: "Sample question 2 for dev", options: ["A", "B", "C", "D"], answer: "B" },
        { question: "Sample question 3 for dev", options: ["A", "B", "C", "D"], answer: "C" },
        { question: "Sample question 4 for dev", options: ["A", "B", "C", "D"], answer: "D" },
        { question: "Sample question 5 for dev", options: ["A", "B", "C", "D"], answer: "A" },
      ];
      return res.json({ questions: mockQuestions, note: "Using mock data (no generative API configured)" });
    }

    const prompt = `
You are a helpful quiz generator.
Create exactly 5 multiple-choice questions to test a user's basic knowledge of "${goal}".
Return a valid JSON array of objects with keys: "question", "options" (array of 4), and "answer" (one of the options).
    `;

    const result = await genAI.generateContent(prompt);
    const raw = extractModelText(result);
    let questions = extractFirstJson(raw);

    if (!questions || !Array.isArray(questions)) {
      console.warn("Quiz parse fallback. Raw:", raw);
      // fallback to mock in dev
      if (process.env.NODE_ENV === "development") {
        return generateQuiz(req, res); // this will hit the dev fallback above
      }
      throw new Error("Model did not return a valid quiz array");
    }

    questions = questions.slice(0, 5).map((q, idx) => {
      const question = q.question || q.q || q.prompt || `Question ${idx + 1}`;
      const options = Array.isArray(q.options) ? q.options.slice(0, 4) : ensureArray(q.options).slice(0, 4);
      const answer = (typeof q.answer === "string" && options.includes(q.answer)) ? q.answer : (options[0] || "");
      return { question, options, answer };
    });

    if (questions.length < 5) {
      while (questions.length < 5) {
        questions.push({ question: "Placeholder question", options: ["A", "B", "C", "D"], answer: "A" });
      }
    }

    return res.json({ questions });
  } catch (err) {
    console.error("generateQuiz error:", err);
    return res.status(500).json({ error: "Failed to generate quiz", detail: err.message || String(err) });
  }
};

export const evaluateQuiz = async (req, res) => {
  const { goal, answers } = req.body;
  if (!goal || !answers) return res.status(400).json({ error: "Goal and answers required" });

  try {
    if (!genAI) {
      // simple heuristic fallback
      const score = answers.filter(a => a.correct).length;
      const level = score >= 4 ? "expert" : score >= 2 ? "intermediate" : "beginner";
      return res.json({ level });
    }

    const prompt = `
Based on these user answers: ${JSON.stringify(answers)} for a quiz about "${goal}",
evaluate if the user's skill level is "beginner", "intermediate", or "expert". Respond with only one of those three words.
    `;
    const result = await genAI.generateContent(prompt);
    let raw = extractModelText(result).trim().toLowerCase();
    const allowed = ["beginner", "intermediate", "expert"];
    let level = allowed.find(l => raw.includes(l)) || "";
    if (!level) {
      const firstToken = raw.split(/\s+/)[0].replace(/[^a-z]/g, "");
      if (allowed.includes(firstToken)) level = firstToken;
    }
    if (!level) level = "beginner";
    return res.json({ level });
  } catch (err) {
    console.error("evaluateQuiz error:", err);
    return res.status(500).json({ error: "Evaluation failed", detail: err.message || String(err) });
  }
};

/* ----------------------------
   Fetch/Save user roadmaps
   ---------------------------- */
export const getUserRoadmaps = async (req, res) => {
  try {
    // Prefer authenticated user from protect middleware. If not present, fall back to URL param.
    const authUserId = req.user?.id || req.user?._id || null;
    const paramUserId = req.params?.userId || null;

    // Only allow listing for authenticated user (or if param matches authenticated user)
    if (!authUserId && !paramUserId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // If both present, ensure they match (prevent listing another user's maps)
    const queryUserId = authUserId || paramUserId;
    if (authUserId && paramUserId && String(authUserId) !== String(paramUserId)) {
      return res.status(403).json({ message: "Forbidden: cannot list other user's roadmaps" });
    }

    const roadmaps = await Roadmap.find({ user: queryUserId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ roadmaps });
  } catch (err) {
    console.error("getUserRoadmaps failed:", err);
    return res.status(500).json({ message: "Failed to fetch user roadmaps", error: err.message || String(err) });
  }
};

export const saveRoadmap = async (req, res) => {
  try {
    // Prefer authenticated user (protect middleware). If not authenticated, fall back to body.userId if present.
    const authUserId = req.user?.id || req.user?._id || null;
    const fallbackUserId = req.body?.userId || null;
    const ownerId = authUserId || fallbackUserId || null;

    const { goal, steps, meta } = req.body;

    if (!goal || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: "Missing required fields for saving roadmap" });
    }

    // Build normalized steps if needed
    const normalized = steps.map((s, idx) => ({
      title: s.title || `Step ${idx + 1}`,
      description: s.description || "",
      startDate: s.startDate || null,
      endDate: s.endDate || null,
      durationDays: s.durationDays || s.__scaledDays || null,
      order: typeof s.order === "number" ? s.order : idx,
      dependencies: Array.isArray(s.dependencies) ? s.dependencies : [],
      raw: s,
    }));

    // ✅ FIX: use 'new mongoose.Types.ObjectId(ownerId)'
    const userObjectId =
      ownerId && mongoose.Types.ObjectId.isValid(ownerId)
        ? new mongoose.Types.ObjectId(ownerId)
        : ownerId;

    const roadmapDoc = new Roadmap({
      user: userObjectId || null,
      title: goal,
      steps: normalized,
      meta: meta || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await roadmapDoc.save();

    return res.status(201).json({ roadmap: saved });
  } catch (err) {
    console.error("saveRoadmap failed:", err);
    return res.status(500).json({
      error: "Failed to save roadmap",
      detail: err.message || String(err),
    });
  }
};

