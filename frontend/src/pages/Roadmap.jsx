// frontend/src/pages/Roadmap.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Loader2, ChevronDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";

export default function Roadmap() {
  // main states
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("beginner");
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { theme } = React.useContext(ThemeContext);
  // test modal
  const [showTest, setShowTest] = useState(false);
  const [answers, setAnswers] = useState({});

  // dropdown suggestion states
  const suggestedGoals = [
    "Data Scientist", "Full Stack Developer", "Cybersecurity Analyst", "UI/UX Designer", "AI Engineer", "Cloud Architect", "Digital Marketer", "Product Manager", "Mobile App Developer", "Game Developer",
  ];
  const [filteredGoals, setFilteredGoals] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // quick test questions (local)
  const questions = [
    { id: 1, question: "How comfortable are you with fundamental concepts in this field?", options: ["Not at all", "Somewhat", "Very comfortable"] },
    { id: 2, question: "How much hands-on experience do you have?", options: ["None", "Some small projects", "Extensive experience"] },
    { id: 3, question: "Can you work independently on tasks related to this goal?", options: ["Not yet", "With some guidance", "Yes, easily"] },
  ];

  // ---------- Dropdown: close on outside click ----------
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
        setHighlightIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------- Dropdown: filtering & keyboard nav ----------
  const handleInputChange = (e) => {
    const value = e.target.value;
    setGoal(value);
    if (value.trim() === "") {
      setFilteredGoals([]);
      setShowDropdown(false);
      setHighlightIndex(-1);
      return;
    }
    const matches = suggestedGoals.filter((s) => s.toLowerCase().includes(value.toLowerCase()));
    setFilteredGoals(matches);
    setShowDropdown(true);
    setHighlightIndex(-1);
  };

  const handleChevronClick = () => {
    if (showDropdown) {
      setShowDropdown(false);
      setHighlightIndex(-1);
      return;
    }
    if (goal.trim() === "") {
      setFilteredGoals(suggestedGoals.slice());
    } else {
      setFilteredGoals(suggestedGoals.filter((s) => s.toLowerCase().includes(goal.toLowerCase())));
    }
    setShowDropdown(true);
    inputRef.current?.focus();
  };

  const handleSelectGoal = (g) => {
    setGoal(g);
    setFilteredGoals([]);
    setShowDropdown(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || filteredGoals.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % filteredGoals.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + filteredGoals.length) % filteredGoals.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0) {
        handleSelectGoal(filteredGoals[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightIndex(-1);
    }
  };

  // ---------- Test modal helpers ----------
  const handleAnswer = (qid, opt) => setAnswers((prev) => ({ ...prev, [qid]: opt }));

  const calculateLevel = () => {
    const vals = Object.values(answers);
    const score = vals.reduce((acc, a) => {
      if (a === "Not at all" || a === "None" || a === "Not yet" || a === undefined) return acc + 0;
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

  // ---------- Generate roadmap ----------
  const handleGenerate = async () => {
    if (!goal.trim()) {
      setError("Please enter a career goal.");
      return;
    }
    setError("");
    setLoading(true);
    setRoadmap([]);

    try {
      const res = await axios.post(
        // FIX 1: Corrected the API endpoint URL
        "http://localhost:5000/api/roadmap/generateRoadmap",
        // FIX 2: Included both 'goal' and 'level' in the request payload
        { 
          career: goal,
          level,
         }
      );
      setRoadmap(res.data.steps || []);
    } catch (err) {
      console.error(err);
      setError("Failed to generate roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- JSX ----------
  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center px-4 py-10">
        <div className="max-w-3xl w-full space-y-8">
          <h1 className="text-3xl font-bold text-center">🎯 AI Career Roadmap Generator</h1>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Enter your goal, optionally take a short test to set your level, then generate a personalized roadmap.
          </p>
          <div className="space-y-4">
            <div
              ref={wrapperRef}
              className={`relative flex items-center gap-3 border rounded-xl px-3 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow duration-300 ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
              }`}
            >
              <input
                ref={inputRef}
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
                className={`ml-2 w-5 h-5 text-gray-400 cursor-pointer transition-transform ${
                  showDropdown ? "rotate-180" : "rotate-0"
                }`}
              />
              {showDropdown && (
                <div
                  className={`absolute left-0 right-0 top-full mt-2 z-50 rounded-lg shadow-xl max-h-48 overflow-y-auto border ${
                    theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
                  }`}
                  role="listbox"
                >
                  {filteredGoals.length === 0 ? (
                    <div className="px-4 py-2 text-gray-500">No suggestions</div>
                  ) : (
                    filteredGoals.map((g, i) => (
                      <div
                        key={g + i}
                        role="option"
                        aria-selected={highlightIndex === i}
                        onMouseDown={(e) => { e.preventDefault(); handleSelectGoal(g); }}
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
                  theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                }`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundSize: '1.25em' }}
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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}
          </div>

          {roadmap.length > 0 && (
            <div className="mt-6 space-y-4">
              <h2 className="text-2xl font-semibold text-center">🗺️ Your Roadmap for {goal}</h2>
              <div className="space-y-4">
                {roadmap.map((s, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="border-l-4 border-blue-600 pl-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                  >
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="text-gray-700 dark:text-gray-300">{s.description}</p>
                    <div className="text-sm text-gray-500">Estimated: {s.estimatedTime}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showTest && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg mx-4"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-center">🧠 Quick Skill Assessment</h3>
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id}>
                    <p className="font-medium mb-2">{q.question}</p>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleAnswer(q.id, opt)}
                          className={`px-3 py-2 rounded-lg border transition cursor-pointer ${
                            answers[q.id] === opt ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setShowTest(false)}
                  className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={submitTest}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white cursor-pointer"
                >
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