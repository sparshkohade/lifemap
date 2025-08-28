import React, { useState } from "react";

export default function RoadmapForm() {
  const [domain, setDomain] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRoadmap(null);

    try {
      const res = await fetch("http://localhost:5000/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, level }),
      });

      const data = await res.json();
      setRoadmap(data);
    } catch (error) {
      console.error("Error generating roadmap:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Create Your Career Roadmap
        </h1>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Domain */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Choose your Domain
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Select Domain --</option>
              <option value="Web Development">Web Development</option>
              <option value="Data Science">Data Science</option>
              <option value="AI/ML">AI / Machine Learning</option>
              <option value="UI/UX Design">UI / UX Design</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Cloud Computing">Cloud Computing</option>
            </select>
          </div>

          {/* Career Level */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Choose your Career Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Select Level --</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Roadmap"}
          </button>
        </form>

        {/* Display Roadmap */}
        {roadmap && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Your Roadmap
            </h2>
            <div className="space-y-4">
              {roadmap.roadmap.map((step, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg bg-gray-50 shadow-sm"
                >
                  <h3 className="font-bold text-blue-600">
                    Step {step.step}: {step.title}
                  </h3>
                  <p className="text-gray-700">{step.description}</p>
                  {step.duration && (
                    <p className="text-sm text-gray-500">
                      Duration: {step.duration}
                    </p>
                  )}
                  {step.resources && (
                    <ul className="list-disc ml-6 text-sm text-gray-600">
                      {step.resources.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
