// frontend/src/pages/RoadmapForm.jsx
import React, { useState, useRef, useEffect } from "react";

/** Safe API base resolver (CRA / Vite / runtime override fallback) */
const resolveApiBase = () => {
  try {
    if (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE) {
      return process.env.REACT_APP_API_BASE;
    }
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) {
      return import.meta.env.VITE_API_BASE;
    }
    if (typeof window !== "undefined" && window.__API_BASE__) {
      return window.__API_BASE__;
    }
    return "http://localhost:5000";
  } catch (err) {
    console.warn("resolveApiBase error:", err);
    return "http://localhost:5000";
  }
};

/** Normalizes a single raw item into UI step shape used in this form */
const normalizeStep = (raw, i) => {
  if (!raw) return { title: `Step ${i + 1}`, description: "No description provided.", duration: "", resources: [] };

  if (typeof raw === "string") {
    return { title: `Step ${i + 1}`, description: raw, duration: "", resources: [] };
  }

  const title = raw.title || raw.name || raw.phase || raw.heading || raw.stepTitle || `Step ${i + 1}`;
  const description = raw.description || raw.desc || raw.summary || raw.body || raw.details || "";
  const duration = raw.duration || raw.estimatedTime || raw.time || raw.eta || raw.duration_estimate || "";
  const resources = Array.isArray(raw.resources) ? raw.resources : Array.isArray(raw.links) ? raw.links : Array.isArray(raw.items) ? raw.items : [];

  return { title, description, duration, resources };
};

/** Extracts an array of steps from many possible server shapes */
const extractSteps = (data) => {
  if (!data) return null;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.steps)) return data.steps;
  if (Array.isArray(data.roadmap)) return data.roadmap;
  if (Array.isArray(data.result)) return data.result;
  if (data?.roadmap && typeof data.roadmap === "object" && !Array.isArray(data.roadmap)) {
    const vals = Object.values(data.roadmap);
    if (Array.isArray(vals[0])) return vals.flat();
    return vals.map((v, i) => (typeof v === "string" ? { description: v, title: Object.keys(data.roadmap)[i] } : v));
  }
  const firstArray = Object.values(data).find((v) => Array.isArray(v));
  if (firstArray) return firstArray;
  return [data];
};

export default function RoadmapForm() {
  const [domain, setDomain] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [steps, setSteps] = useState(null);

  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSteps(null);

    if (!domain.trim()) {
      setError("Please select a domain.");
      return;
    }
    if (!level) {
      setError("Please select your career level.");
      return;
    }

    setLoading(true);

    if (abortRef.current) {
      try { abortRef.current.abort(); } catch (e) {}
    }
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      const base = resolveApiBase();
      const url = `${base}/api/roadmap/generateRoadmap`;
      const payload = { career: domain, level: level.toLowerCase() };

      const timeout = setTimeout(() => {
        try { abortRef.current?.abort(); } catch (e) {}
      }, 60_000);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        let msg = `Server returned ${res.status}`;
        try {
          const errJson = await res.json();
          msg = errJson?.message || JSON.stringify(errJson);
        } catch (err) {}
        throw new Error(msg);
      }

      const data = await res.json();
      console.log("Raw roadmap response:", data);

      const rawSteps = extractSteps(data);
      if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
        setError(data?.message || "No roadmap steps returned. Try again later or choose a different domain.");
        setLoading(false);
        return;
      }

      const normalized = rawSteps.map((r, i) => normalizeStep(r, i));
      setSteps(normalized);
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request canceled.");
      } else {
        setError(err.message || "Error generating roadmap. Try again.");
        console.error("Generate roadmap error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Create Your Career Roadmap</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="domain" className="block text-gray-700 font-medium mb-2">
              Choose your Domain
            </label>
            <select
              id="domain"
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

          <div>
            <label htmlFor="level" className="block text-gray-700 font-medium mb-2">
              Choose your Career Level
            </label>
            <select
              id="level"
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

          {error && <div className="text-red-600">{error}</div>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Roadmap"}
            </button>

            <button
              type="button"
              onClick={() => {
                setDomain("");
                setLevel("");
                setError("");
                setSteps(null);
              }}
              className="px-6 py-2 rounded-lg border"
            >
              Clear
            </button>
          </div>
        </form>

        {/* Results */}
        <div className="mt-8">
          {!steps && !error && <div className="text-center text-gray-500">No roadmap yet — generate one to get started.</div>}

          {steps && (
            <>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Roadmap</h2>
              <div className="space-y-4">
                {steps.map((step, idx) => (
                  <div key={idx} className="p-4 border rounded-lg bg-gray-50 shadow-sm">
                    <h3 className="font-bold text-blue-600">{step.title || `Step ${idx + 1}`}</h3>
                    <p className="text-gray-700 mt-1">{step.description}</p>
                    {step.duration && <p className="text-sm text-gray-500 mt-2">Duration: {step.duration}</p>}
                    {step.resources && step.resources.length > 0 && (
                      <ul className="list-disc ml-6 text-sm text-gray-600 mt-2">
                        {step.resources.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
