// frontend/src/pages/RoadmapResult.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function RoadmapResult() {
  const location = useLocation();
  const { goal } = location.state || {}; // goal passed from previous page
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoadmap() {
      try {
        const res = await fetch("http://localhost:5000/api/roadmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal }),
        });

        const data = await res.json();

        // AI might return JSON as string → parse it
        let parsed;
        if (typeof data.roadmap === "string") {
          try {
            parsed = JSON.parse(data.roadmap);
          } catch (err) {
            console.error("Invalid JSON from AI:", err);
            parsed = null;
          }
        } else {
          parsed = data.roadmap;
        }

        setRoadmap(parsed);
      } catch (err) {
        console.error("Error fetching roadmap:", err);
      } finally {
        setLoading(false);
      }
    }

    if (goal) fetchRoadmap();
  }, [goal]);

  if (loading) return <p className="p-6">Loading roadmap...</p>;
  if (!roadmap) return <p className="p-6 text-red-500">Failed to load roadmap.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Roadmap for {goal}</h1>

      {Object.keys(roadmap).map((category) => (
        <div key={category} className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{category}</h2>
          <ul className="list-disc ml-6 space-y-2">
            {roadmap[category].map((task, idx) => (
              <li key={idx}>
                <strong>{task.title}</strong>{" "}
                {task.description && <>– {task.description}</>}{" "}
                {task.estimated_time && (
                  <span className="text-sm text-gray-500">
                    ({task.estimated_time})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
