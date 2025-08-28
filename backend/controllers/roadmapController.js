// backend/controllers/roadmapController.js

export const generateRoadmap = async (req, res) => {
  const { domain, level } = req.body;

  if (!domain || !level) {
    return res.status(400).json({ error: "Domain and level are required" });
  }

  // Dummy roadmap for now (replace later with AI)
  res.json({
    domain,
    level,
    steps: [
      `Step 1: Learn the basics of ${domain}`,
      `Step 2: Practice intermediate concepts in ${domain}`,
      `Step 3: Work on advanced ${domain} projects`
    ]
  });
};
