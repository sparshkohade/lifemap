// frontend/src/pages/Roadmap.jsx
import React, { useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";

export default function Roadmap() {
  const [goal, setGoal] = useState("");
  const [step, setStep] = useState(1); // 1 = Quiz, 2 = Roadmap
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [level, setLevel] = useState("");
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch quiz questions from backend
  const fetchQuiz = async () => {
    if (!goal.trim()) {
      setError("Please enter your career goal.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/roadmap/quiz", { goal });
      setQuestions(res.data.questions);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Submit quiz answers and get skill level
  const submitQuiz = async () => {
    if (Object.keys(answers).length !== questions.length) {
      setError("Please answer all questions.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/roadmap/evaluate", {
        goal,
        answers,
      });
      setLevel(res.data.level);
      setStep(2); // move to roadmap generation
      generateRoadmap(res.data.level); // auto-generate roadmap after evaluation
    } catch (err) {
      console.error(err);
      setError("Failed to evaluate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Generate AI roadmap
  const generateRoadmap = async (userLevel) => {
    setLoading(true);
    setRoadmap([]);
    try {
      const res = await axios.post("http://localhost:5000/api/roadmap/generate", {
        goal,
        level: userLevel,
      });
      setRoadmap(res.data.steps);
    } catch (err) {
      console.error(err);
      setError("Failed to generate roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center px-4 py-10">
        <div className="max-w-3xl w-full space-y-8">
          <h1 className="text-3xl font-bold text-center">🎯 AI Career Roadmap Generator</h1>
          <p className="text-center text-gray-600 dark:text-gray-400">
            {step === 1
              ? "Answer a few quick questions so we can personalize your roadmap."
              : `Here’s your personalized career roadmap! (Skill level: ${level})`}
          </p>

          {/* Step 1: Quiz */}
          {step === 1 && (
            <div className="space-y-6">
              <input
                type="text"
                placeholder="Enter your career goal (e.g., Data Scientist)"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {questions.length === 0 ? (
                <button
                  onClick={fetchQuiz}
                  disabled={loading || !goal.trim()}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition mt-4"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin w-5 h-5" /> Loading Quiz...
                    </div>
                  ) : (
                    "Start Quiz"
                  )}
                </button>
              ) : (
                <>
                  {questions.map((q, idx) => (
                    <div key={idx} className="space-y-2">
                      <p className="font-medium">{q.question}</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {q.options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() =>
                              setAnswers({ ...answers, [q.id]: i + 1 })
                            }
                            className={`px-4 py-2 rounded-lg border ${
                              answers[q.id] === i + 1
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-gray-700"
                            } transition`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={submitQuiz}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition mt-4"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin w-5 h-5" /> Evaluating...
                      </div>
                    ) : (
                      "Submit Quiz & Generate Roadmap"
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 2: Roadmap Display */}
          {step === 2 && roadmap.length > 0 && (
            <div className="mt-8 space-y-6">
              {roadmap.map((s, i) => (
                <div
                  key={i}
                  className="border-l-4 border-blue-600 pl-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm"
                >
                  <h3 className="font-semibold text-lg">{s.title}</h3>
                  <p className="text-gray-700 dark:text-gray-300">{s.description}</p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Estimated Time: {s.estimatedTime}
                  </span>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-red-500 text-center">{error}</p>}
        </div>
      </div>
    </>
  );
}
