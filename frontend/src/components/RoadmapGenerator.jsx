// src/components/RoadmapGenerator.jsx
import React, { useState } from "react";
import axios from "axios";
import RoadmapTimeline from "./RoadmapTimeline";


export default function RoadmapGenerator({ user }) {
  const [goal, setGoal] = useState("");
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!goal) return;

    setLoading(true);
    setError("");
    setRoadmap([]);

    try {
      const res = await axios.post("/api/roadmaps", {
        userId: user?._id,
        goal,
      });

      setRoadmap(res.data.roadmap.steps);
    } catch (err) {
      console.error(err);
      setError("Failed to generate roadmap. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h2 className="text-3xl font-bold mb-6 text-center">Generate Your Career Roadmap</h2>

      <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Enter your career goal (e.g., Data Scientist)"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {roadmap.length > 0 && (
        <div className="relative border-l-4 border-blue-600 ml-4 mt-4">
            {roadmap.map((step, index) => (
            <div key={index} className="mb-8 ml-6 relative">
                {/* Timeline Dot */}
                <div className="absolute -left-5 top-0 w-4 h-4 bg-blue-600 rounded-full border-2 border-white dark:border-gray-900"></div>

                {/* Step Content */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-gray-700 dark:text-gray-300">{step.description}</p>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    Estimated Time: {step.estimatedTime}
                </span>
                </div>
            </div>
            ))}
        </div>
    )}
    </div>
  );
}
