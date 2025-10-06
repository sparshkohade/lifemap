// src/pages/Roadmap.jsx
import React, { useState } from "react";
import jsPDF from "jspdf";

export default function Roadmap() {
  const [domain, setDomain] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);

  // Demo roadmap to show initially
  const demoRoadmap = {
    roadmap: [
      {
        step: 1,
        title: "Learn HTML & CSS",
        description: "Understand the basics of web development including HTML structure and CSS styling.",
        duration: "1-2 weeks",
        resources: ["MDN Web Docs", "freeCodeCamp"]
      },
      {
        step: 2,
        title: "JavaScript Fundamentals",
        description: "Learn JS basics, DOM manipulation, and events.",
        duration: "2-3 weeks",
        resources: ["Eloquent JavaScript", "JavaScript.info"]
      },
      {
        step: 3,
        title: "React.js",
        description: "Learn React components, hooks, state management, and building SPAs.",
        duration: "3-4 weeks",
        resources: ["React Docs", "Scrimba React Course"]
      }
    ]
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!domain) return alert("Please enter a domain");

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
    } catch (err) {
      console.error(err);
      alert("Failed to generate roadmap");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!roadmap && !demoRoadmap) return;
    const dataToCopy = (roadmap || demoRoadmap).roadmap
      .map(step => `Step ${step.step}: ${step.title}\n${step.description}\n${step.duration ? "Duration: " + step.duration : ""}\n`)
      .join("\n");
    navigator.clipboard.writeText(dataToCopy);
    alert("Roadmap copied to clipboard!");
  };

  const handleDownloadPDF = () => {
    if (!roadmap && !demoRoadmap) return;
    const doc = new jsPDF();
    const steps = (roadmap || demoRoadmap).roadmap;

    doc.setFontSize(16);
    doc.text("Career Roadmap", 105, 20, { align: "center" });

    let y = 30;
    steps.forEach(step => {
      doc.setFontSize(14);
      doc.text(`Step ${step.step}: ${step.title}`, 10, y);
      y += 8;
      doc.setFontSize(12);
      doc.text(step.description, 10, y);
      y += 6;
      if (step.duration) {
        doc.text(`Duration: ${step.duration}`, 10, y);
        y += 6;
      }
      if (step.resources) {
        doc.text("Resources:", 10, y);
        y += 6;
        step.resources.forEach(r => {
          doc.text(`- ${r}`, 12, y);
          y += 6;
        });
      }
      y += 8;
    });

    doc.save("roadmap.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 transition-colors duration-300">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
        Career Roadmap Generator
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Select Options
          </h2>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">
                Domain
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                required
              >
                <option value="">-- Select Domain --</option>
                <option>Web Development</option>
                <option>Data Science</option>
                <option>AI / ML</option>
                <option>UI / UX Design</option>
                <option>Cybersecurity</option>
                <option>Cloud Computing</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">
                Career Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg font-semibold text-white transition ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Generating..." : "Generate Roadmap"}
            </button>
          </form>

          <div className="mt-4 flex gap-4">
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
            >
              Copy Roadmap
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* Roadmap Display Section */}
        <div className="space-y-4">
          {(roadmap || demoRoadmap) && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                {roadmap ? "Your Roadmap" : "Demo Roadmap"}
              </h2>

              {(roadmap || demoRoadmap).roadmap.map((step, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700"
                >
                  <h3 className="font-bold text-blue-600 dark:text-blue-400 mb-1">
                    Step {step.step}: {step.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-200">{step.description}</p>
                  {step.duration && (
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      Duration: {step.duration}
                    </p>
                  )}
                  {step.resources && (
                    <ul className="list-disc ml-6 text-sm text-gray-600 dark:text-gray-300">
                      {step.resources.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
