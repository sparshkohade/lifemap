// backend/controllers/roadmapController.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateRoadmap = async (req, res) => {
  const { goal } = req.body;

  const prompt = `
You are an expert roadmap generator.
Given a career goal, create a hierarchical roadmap like roadmap.sh.

⚠️ VERY IMPORTANT:
- Respond with **ONLY valid JSON**.
- Do not add explanations, text, or markdown fences.
- The JSON must follow this schema:
{
  "Foundations": [
    { "title": "string", "description": "string", "estimated_time": "string", "prerequisite": "string or null" }
  ],
  "Intermediate": [ ... ],
  "Advanced": [ ... ]
}

Now generate the roadmap for this goal: ${goal}
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // 🔹 Clean up: remove accidental code fences / extra formatting
    text = text.replace(/```json|```/g, "").trim();

    let roadmap;
    try {
      roadmap = JSON.parse(text);
    } catch (err) {
      console.error("❌ JSON parsing failed. Raw Gemini output:\n", text);
      return res.status(500).json({ error: "AI response was not valid JSON" });
    }

    // ✅ Success: return roadmap JSON
    res.json({ roadmap });
  } catch (error) {
    console.error("❌ Error generating roadmap:", error);
    res.status(500).json({ error: "Failed to generate roadmap" });
  }
};
