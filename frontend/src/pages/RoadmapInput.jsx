// frontend/src/pages/RoadmapInput.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function RoadmapInput() {
  const [domain, setDomain] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!domain) return alert("Please enter a domain");

    setLoading(true);
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/roadmap/generate",
        { domain, level }
      );

      // Navigate to roadmap result page with data
      navigate("/roadmap/result", { state: { roadmap: data } });
    } catch (err) {
      console.error(err);
      alert("Failed to generate roadmap");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Generate Your Roadmap</h1>
      <form onSubmit={handleGenerate} className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <label className="block mb-4">
          <span className="text-gray-700 font-medium">Domain</span>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g., Web Development"
            className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="block mb-6">
          <span className="text-gray-700 font-medium">Level</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </label>

        <button
          type="submit"
          className={`w-full px-4 py-2 rounded-lg text-white font-semibold transition ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Roadmap"}
        </button>
      </form>
    </div>
  );
}
