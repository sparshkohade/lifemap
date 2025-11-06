// frontend/src/pages/Roadmap.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { Loader2, ChevronDown, ArrowRight, Share2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
import RoadmapChart from "../components/RoadmapChart";

/** --- Helper: safely resolve API base across build tools (CRA / Vite / plain) --- */
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
    console.warn("⚠️ Could not resolve API base, using default localhost:", err);
    return "http://localhost:5000";
  }
};

const SUGGESTED_GOALS = [
  "Data Scientist",
  "Full Stack Developer",
  "Cybersecurity Analyst",
  "UI/UX Designer",
  "AI Engineer",
  "Cloud Architect",
  "Digital Marketer",
  "Product Manager",
  "Mobile App Developer",
  "Game Developer",
];

function RoadmapItem({ step, defaultCollapsed = false, isOpen: controlledIsOpen, onToggle, highlighted }) {
  const [open, setOpen] = useState(!defaultCollapsed);

  useEffect(() => {
    if (typeof controlledIsOpen === "boolean") {
      setOpen(controlledIsOpen);
    }
  }, [controlledIsOpen]);

  const toggle = () => {
    if (typeof onToggle === "function") {
      onToggle(!open);
    }
    setOpen((s) => !s);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`relative ${highlighted ? "ring-4 ring-yellow-300/60 rounded-lg" : ""}`}
    >
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <span className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-white dark:ring-gray-900" />
          <div className="w-px bg-gray-200 dark:bg-gray-700 flex-1" />
        </div>

        <div className="flex-1 bg-white dark:bg-gray-800 border rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">{step.title}</h3>
              {step.estimatedTime && (
                <div className="text-sm text-gray-500 dark:text-gray-400">Estimated: {step.estimatedTime}</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggle}
                aria-expanded={open}
                className="px-3 py-1 rounded-md text-sm bg-gray-100 dark:bg-gray-700 hover:opacity-90"
              >
                {open ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 text-gray-700 dark:text-gray-300"
              >
                <p>{step.description}</p>
                {step.substeps && step.substeps.length > 0 && (
                  <ul className="mt-2 list-disc ml-5 text-sm text-gray-600 dark:text-gray-400">
                    {step.substeps.map((ss, i) => (
                      <li key={i}>{ss}</li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function Roadmap() {
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("beginner");
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { theme } = React.useContext(ThemeContext);

  // suggestions dropdown
  const [filteredGoals, setFilteredGoals] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // refs
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // abort controller for requests (support axios signal and legacy cancel token)
  const abortRef = useRef({ controller: null, cancelSource: null });

  // debounce timer
  const debounceRef = useRef(null);

  // test modal
  const [showTest, setShowTest] = useState(false);
  const [answers, setAnswers] = useState({});

  // controlled expansion state — syncs chart clicks with cards
  const [expandedIndex, setExpandedIndex] = useState(null);

  // highlight + toast
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [toast, setToast] = useState("");
  const toastTimerRef = useRef(null);

  // --- dropdown & outside click ---
  useEffect(() => {
    function onDocClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
        setHighlightIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // --- debounce input for suggestions ---
  const applyFilter = useCallback((value) => {
    if (!value || !value.trim()) {
      setFilteredGoals([]);
      setShowDropdown(false);
      setHighlightIndex(-1);
      return;
    }
    const matches = SUGGESTED_GOALS.filter((s) => s.toLowerCase().includes(value.toLowerCase()));
    setFilteredGoals(matches);
    setShowDropdown(true);
    setHighlightIndex(-1);
  }, []);

  const handleInputChange = (e) => {
    const v = e.target.value;
    setGoal(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyFilter(v), 180);
  };

  const handleChevronClick = () => {
    if (showDropdown) {
      setShowDropdown(false);
      setHighlightIndex(-1);
      return;
    }
    setFilteredGoals(goal.trim() ? SUGGESTED_GOALS.filter((s) => s.toLowerCase().includes(goal.toLowerCase())) : SUGGESTED_GOALS.slice());
    setShowDropdown(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelectGoal = (g) => {
    setGoal(g);
    setFilteredGoals([]);
    setShowDropdown(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || filteredGoals.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, filteredGoals.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && filteredGoals[highlightIndex]) handleSelectGoal(filteredGoals[highlightIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightIndex(-1);
    }
  };

  // --- Test modal helpers ---
  const questions = [
    { id: 1, question: "How comfortable are you with fundamental concepts in this field?", options: ["Not at all", "Somewhat", "Very comfortable"] },
    { id: 2, question: "How much hands-on experience do you have?", options: ["None", "Some small projects", "Extensive experience"] },
    { id: 3, question: "Can you work independently on tasks related to this goal?", options: ["Not yet", "With some guidance", "Yes, easily"] },
  ];

  const handleAnswer = (qid, opt) => setAnswers((prev) => ({ ...prev, [qid]: opt }));

  const calculateLevel = () => {
    const vals = Object.values(answers);
    const score = vals.reduce((acc, a) => {
      if (!a) return acc;
      if (a === "Not at all" || a === "None" || a === "Not yet") return acc + 0;
      if (a === "Somewhat" || a === "Some small projects" || a === "With some guidance") return acc + 1;
      return acc + 2;
    }, 0);
    if (score <= 2) return "beginner";
    if (score <= 4) return "intermediate";
    return "expert";
  };

  const submitTest = () => {
    setLevel(calculateLevel());
    setShowTest(false);
  };

  const startTest = () => {
    if (!goal.trim()) {
      setError("Please enter a career goal first.");
      return;
    }
    setError("");
    setAnswers({});
    setShowTest(true);
  };

  // --- generate roadmap (abort previous, handle backend errors) ---
  const handleGenerate = async () => {
    if (!goal.trim()) {
      setError("Please enter a career goal.");
      return;
    }
    setError("");
    setLoading(true);
    setRoadmap([]);
    setExpandedIndex(null);

    // abort previous
    try {
      if (abortRef.current.controller) abortRef.current.controller.abort();
      if (abortRef.current.cancelSource) abortRef.current.cancelSource.cancel("new-request");
    } catch (e) {
      // ignore
    }

    // create new aborts
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const cancelSource = axios.CancelToken ? axios.CancelToken.source() : null;
    abortRef.current = { controller, cancelSource };

    try {
      const baseURL = resolveApiBase();
      const url = `${baseURL}/api/roadmaps/generate`;

      const payload = { career: goal, level };

      const axiosConfig = { timeout: 60000 };
      if (controller) axiosConfig.signal = controller.signal;
      if (cancelSource) axiosConfig.cancelToken = cancelSource.token;

      const res = await axios.post(url, payload, axiosConfig);
      const steps = res.data?.roadmap || res.data?.steps || (Array.isArray(res.data) ? res.data : null);

      if (!Array.isArray(steps) || steps.length === 0) {
        setError(res.data?.message || "No roadmap steps returned. Try a different goal or try again later.");
        setRoadmap([]);
      } else {
        const normalized = steps.map((s, i) => ({
          title: s.title || s.phase || s.name || `Step ${i + 1}`,
          description: s.description || s.desc || s.summary || s.text || "No description provided.",
          estimatedTime: s.estimatedTime || s.duration || s.time || s.eta || "Unspecified",
          substeps: s.substeps || s.tasks || [],
        }));
        setRoadmap(normalized);
      }
    } catch (err) {
      if (axios.isCancel && axios.isCancel(err)) {
        console.log("Request canceled");
      } else if (err.name === "CanceledError") {
        console.log("Request canceled (fetch-like)");
      } else if (err.code === "ECONNABORTED") {
        setError("Request timed out. Try again.");
      } else {
        const message = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to generate roadmap. Please try again.";
        setError(message);
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      try {
        if (abortRef.current.controller) abortRef.current.controller.abort();
        if (abortRef.current.cancelSource) abortRef.current.cancelSource.cancel("unmount");
      } catch (e) {}
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // --- share & save helpers ---
  const handleShare = async () => {
    if (!roadmap || roadmap.length === 0) {
      setError("Generate a roadmap first to share it.");
      return;
    }
    const payload = { title: `Roadmap: ${goal}`, roadmap };
    if (navigator.share) {
      try {
        await navigator.share({ title: `Roadmap — ${goal}`, text: `Here's my roadmap for ${goal}.`, url: window.location.href });
      } catch (e) {
        console.log("Share cancelled or failed", e);
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      alert("Roadmap copied to clipboard (JSON). You can paste it in a document or chat.");
    } catch (e) {
      setError("Unable to copy to clipboard. Please select and copy manually.");
    }
  };

  const handleSave = async () => {
    try {
      if (!roadmap.length) {
        setError("Generate a roadmap first to save it.");
        return;
      }

      const inferredUserId =
        (typeof window !== "undefined" && window.__USER_ID__) ||
        (typeof localStorage !== "undefined" && localStorage.getItem("userId")) ||
        null;

      const steps = roadmap.map((s) => ({
        title: s.title || s.name || "Untitled step",
        description: s.description || s.desc || s.text || "",
        estimatedTime: s.estimatedTime || s.time || s.eta || "Unspecified",
      }));

      const baseURL = resolveApiBase();
      const payload = { goal, steps, ...(inferredUserId ? { userId: inferredUserId } : {}) };

      const res = await axios.post(`${baseURL}/api/roadmaps/save`, payload, { timeout: 30000 });

      console.log("Save response:", res.status, res.data);

      if (res.status === 201 || res.status === 200) {
        alert("Roadmap saved successfully.");
      } else {
        alert(res.data?.message || "Save completed (check server response).");
      }
    } catch (err) {
      if (err.response) {
        console.error("Save failed - response:", { status: err.response.status, data: err.response.data, url: err.config?.url });
        setError(err.response.data?.message || `Save failed (server ${err.response.status})`);
      } else if (err.request) {
        console.error("Save failed - no response:", err.request);
        setError("No response from server. Is the backend running?");
      } else {
        console.error("Save failed:", err.message);
        setError(err.message || "Save failed due to an unknown error.");
      }
    }
  };

  // Chart point click handler — opens the corresponding card, highlights it and shows a toast
  const onChartPointClick = (index) => {
    if (typeof index !== "number") return;

    setExpandedIndex((prev) => (prev === index ? null : index));

    // highlight the card briefly
    setHighlightedIndex(index);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setHighlightedIndex(null), 1200);

    // scroll the corresponding element into view
    setTimeout(() => {
      const el = document.querySelector(`#roadmap-item-${index}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);

    // small toast feedback using framer-motion UI
    setToast(`Opened phase ${index + 1}`);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast("");
      toastTimerRef.current = null;
    }, 1600);
  };

  return (
    <>
      {/* Animated toast (framer-motion) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="roadmap-toast"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed left-1/2 transform -translate-x-1/2 top-6 z-50"
            aria-live="polite"
          >
            <div className="bg-black text-white px-4 py-2 rounded shadow-lg">{toast}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center px-4 py-10">
        <div className="max-w-4xl w-full space-y-8">
          <h1 className="text-3xl font-bold text-center">🎯 AI Career Roadmap Generator</h1>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Enter your goal, take a short assessment to set your level, then generate a personalized roadmap.
          </p>

          <div className="space-y-4">
            <div
              ref={wrapperRef}
              className={`relative flex items-center gap-3 border rounded-xl px-3 transition-shadow duration-300 focus-within:ring-2 focus-within:ring-blue-500 ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
              }`}
            >
              <input
                ref={inputRef}
                aria-label="Career goal"
                aria-haspopup="listbox"
                aria-expanded={showDropdown}
                type="text"
                placeholder="Search or type your goal..."
                value={goal}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={`flex-1 w-full py-3 bg-transparent focus:outline-none ${
                  theme === "dark" ? "text-gray-100 placeholder-gray-400" : "text-gray-900 placeholder-gray-500"
                }`}
              />
              <ChevronDown
                onClick={handleChevronClick}
                className={`ml-2 w-5 h-5 text-gray-400 cursor-pointer transition-transform ${showDropdown ? "rotate-180" : "rotate-0"}`}
                aria-hidden
              />
              {showDropdown && (
                <div
                  className={`absolute left-0 right-0 top-full mt-2 z-50 rounded-lg shadow-xl max-h-48 overflow-y-auto border focus:outline-none ${
                    theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
                  }`}
                  role="listbox"
                >
                  {filteredGoals.length === 0 ? (
                    <div className="px-4 py-2 text-gray-500">No suggestions</div>
                  ) : (
                    filteredGoals.map((g, i) => (
                      <div
                        id={`suggest-${i}`}
                        key={`${g}-${i}`}
                        role="option"
                        aria-selected={highlightIndex === i}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectGoal(g);
                        }}
                        onMouseEnter={() => setHighlightIndex(i)}
                        className={`px-4 py-2 cursor-pointer transition flex items-center gap-2 ${
                          highlightIndex === i ? "bg-blue-600 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        {g}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className={`flex-1 w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 appearance-none bg-no-repeat cursor-pointer ${
                  theme === "dark" ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"
                }`}
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                  backgroundPosition: "right 1rem center",
                  backgroundSize: "1.25em",
                }}
                aria-label="Skill level"
              >
                <option value="beginner">Beginner (Just starting out)</option>
                <option value="intermediate">Intermediate (Some experience)</option>
                <option value="expert">Expert (Strong foundation)</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  if (!goal.trim()) {
                    setError("Please enter a career goal first.");
                    return;
                  }
                  setError("");
                  navigate(`/test/${encodeURIComponent(goal)}`);
                }}
                className="w-full sm:w-auto shrink-0 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity duration-300 cursor-pointer"
              >
                Take AI Test
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin w-5 h-5" /> Generating...
                  </div>
                ) : (
                  <>
                    Generate Roadmap <ArrowRight className="inline ml-2" />
                  </>
                )}
              </button>

              <button onClick={handleShare} title="Share roadmap" className="px-4 py-3 rounded-xl border flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </button>

              <button onClick={handleSave} title="Save roadmap (backend required)" className="px-4 py-3 rounded-xl border flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}
          </div>

          {/* Roadmap timeline + chart */}
          <div className="mt-6">
            {roadmap.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">No roadmap yet — generate one to get started.</div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-center">🗺️ Your Roadmap for {goal}</h2>

                {/* Chart overview (uses recharts) */}
                <div className="mt-4">
                  <RoadmapChart steps={roadmap} height={320} onPointClick={onChartPointClick} />
                </div>

                {/* Detailed timeline (cards) — clickable and controlled by expandedIndex */}
                <div className="mt-6 space-y-4">
                  {roadmap.map((s, idx) => (
                    <div id={`roadmap-item-${idx}`} key={idx} className={`transition-all ${highlightedIndex === idx ? "animate-pulse" : ""}`}>
                      <RoadmapItem
                        step={s}
                        defaultCollapsed={idx > 0}
                        isOpen={expandedIndex === idx}
                        onToggle={(nextOpen) => {
                          setExpandedIndex(nextOpen ? idx : null);
                        }}
                        highlighted={highlightedIndex === idx}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline Test Modal */}
      <AnimatePresence>
        {showTest && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg mx-4" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <h3 className="text-lg font-semibold mb-4 text-center">🧠 Quick Skill Assessment</h3>
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id}>
                    <p className="font-medium mb-2">{q.question}</p>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => (
                        <button key={opt} onClick={() => handleAnswer(q.id, opt)} className={`px-3 py-2 rounded-lg border transition cursor-pointer ${answers[q.id] === opt ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setShowTest(false)} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 cursor-pointer">
                  Cancel
                </button>
                <button onClick={submitTest} className="px-4 py-2 rounded-md bg-blue-600 text-white cursor-pointer">
                  Submit Test
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
