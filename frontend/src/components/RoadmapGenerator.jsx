// src/components/RoadmapGenerator.jsx
import React, { useState } from "react";
import axios from "axios";
import RoadmapTimeline from "./RoadmapTimeline";

export default function RoadmapGenerator({ user }) {
  const [career, setCareer] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!career) return setError("Please enter a career goal.");

    setLoading(true);
    setError("");
    setSteps([]);
    setNote("");

    try {
      // call backend generate endpoint (matches recommended router /generate)
      const res = await axios.post("/api/roadmaps/generate", {
        career,
        level,
      });

      // backend returns { roadmap } where roadmap is an array of phases
      // Each phase may have keys: phase, description, duration (or duration string)
      const roadmap = res.data?.roadmap;

      if (!Array.isArray(roadmap) || roadmap.length === 0) {
        throw new Error("No roadmap returned from server");
      }

      // Map phases -> steps expected by Roadmap model & UI
      const mappedSteps = roadmap.map((p, idx) => {
        // handle different possible shapes from backend/AI
        const title = p.phase || p.title || p.name || `Phase ${idx + 1}`;
        const description = p.description || p.desc || p.summary || "";
        const estimatedTime = p.duration || p.estimatedTime || p.timeframe || "Unspecified";
        return { title, description, estimatedTime };
      });

      setSteps(mappedSteps);
      setNote("Roadmap generated — review and save when ready.");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Failed to generate roadmap. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?._id) return setError("You must be logged in to save a roadmap.");
    if (!steps.length) return setError("Generate a roadmap before saving.");

    setSaving(true);
    setError("");
    setNote("");

    try {
      const payload = {
        userId: user._id,
        goal: career,
        steps, // array of { title, description, estimatedTime } which matches the model
      };
      const res = await axios.post("/api/roadmaps/save", payload);
      setNote("Roadmap saved successfully.");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to save roadmap.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h2 className="text-3xl font-bold mb-6 text-center">Generate Your Career Roadmap</h2>

      <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Enter your career goal (e.g., Data Scientist)"
          value={career}
          onChange={(e) => setCareer(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none"
        >
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Expert</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {note && <p className="text-green-600 mb-4">{note}</p>}

      {steps.length > 0 && (
        <>
          <div className="relative border-l-4 border-blue-600 ml-4 mt-4 mb-6">
            {steps.map((step, index) => (
              <div key={index} className="mb-8 ml-6 relative">
                <div className="absolute -left-5 top-0 w-4 h-4 bg-blue-600 rounded-full border-2 border-white dark:border-gray-900"></div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{step.description}</p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Estimated Time: {step.estimatedTime}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Roadmap"}
            </button>

            <button
              onClick={() => {
                setSteps([]);
                setCareer("");
                setNote("");
                setError("");
              }}
              className="px-5 py-2 border rounded-lg hover:bg-gray-100 transition"
            >
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  );
}
