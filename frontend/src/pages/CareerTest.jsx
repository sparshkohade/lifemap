// frontend/src/pages/CareerTest.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Loader2, CheckCircle, AlertTriangle, Sun, Moon } from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";

const CareerTest = () => {
  const { field } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext); // ✅ get theme & toggle
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [aiLevel, setAiLevel] = useState("");
  const [evaluating, setEvaluating] = useState(false);

  // 🎯 Fetch AI-generated questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.post("http://localhost:5000/api/roadmap/generateQuiz", {
          goal: field,
          count: 5, // ✅ ensure 5 questions
        });
        setQuestions(res.data.questions.slice(0, 5)); // fallback to 5
      } catch (error) {
        console.error("Error fetching test:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [field]);

  // ✅ Handle answer selection
  const handleSelect = (qIndex, option) => {
    setAnswers({ ...answers, [qIndex]: option });
  };

  // 🧠 Submit for AI evaluation
  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions!");
      return;
    }

    setEvaluating(true);
    try {
      const res = await axios.post("http://localhost:5000/api/roadmap/evaluateQuiz", {
        goal: field,
        answers,
      });

      setAiLevel(res.data.level || "beginner");
      setSubmitted(true);
    } catch (error) {
      console.error("Error evaluating quiz:", error);
      alert("Something went wrong while evaluating. Try again!");
    } finally {
      setEvaluating(false);
    }
  };

  // 🚀 Proceed to roadmap generation
  const handleGenerateRoadmap = () => {
    navigate(`/roadmap?goal=${encodeURIComponent(field)}&level=${aiLevel}`);
  };

  // 🌓 Theme background
  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-[#0a0a0a] text-gray-200" : "bg-gray-50 text-gray-900";
  const cardClass = isDark ? "bg-[#111]" : "bg-white";
  const optionClass = (selected) =>
    selected
      ? "bg-blue-600 border-blue-500 text-white"
      : isDark
      ? "bg-[#121212] border-gray-700 hover:border-blue-500"
      : "bg-gray-100 border-gray-300 hover:border-blue-500";

  // 🌀 Loading states
  if (loading || evaluating) {
    const message = loading
      ? `Generating AI-powered test for ${field}...`
      : "Evaluating your answers with AI...";
    return (
      <div className={`flex items-center justify-center h-screen ${bgClass}`}>
        <Loader2 className="animate-spin mr-2" /> {message}
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-500 ${bgClass}`}>
      

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className={`max-w-3xl mx-auto ${cardClass} p-8 rounded-2xl shadow-lg transition-all duration-500`}
      >
        <h1 className="text-3xl font-bold mb-4 text-blue-500 text-center">
          {field} Skill Assessment
        </h1>

        {!submitted ? (
          <>
            <p className="text-gray-400 mb-6 text-center">
              Answer the following 5 questions to determine your current skill level.
            </p>

            {questions.map((q, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className={`mb-6 p-5 rounded-xl shadow-sm border ${isDark ? "border-gray-800" : "border-gray-200"}`}
              >
                <h3 className="font-semibold mb-3">
                  {i + 1}. {q.question}
                </h3>
                <div className="grid gap-2">
                  {q.options.map((opt, j) => (
                    <label
                      key={j}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border transition ${optionClass(
                        answers[i] === opt
                      )}`}
                      onClick={() => handleSelect(i, opt)}
                    >
                      <input
                        type="radio"
                        name={`q${i}`}
                        checked={answers[i] === opt}
                        onChange={() => handleSelect(i, opt)}
                        className="hidden"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </motion.div>
            ))}

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg mt-4 font-semibold transition"
            >
              Submit Test
            </button>
          </>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            {aiLevel === "expert" ? (
              <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-3" />
            ) : aiLevel === "intermediate" ? (
              <CheckCircle className="text-blue-500 w-16 h-16 mx-auto mb-3" />
            ) : (
              <AlertTriangle className="text-yellow-400 w-16 h-16 mx-auto mb-3" />
            )}

            <h2 className="text-2xl font-bold mb-2 capitalize">
              Your Skill Level: {aiLevel}
            </h2>
            <p className="text-gray-400 mb-6">
              {aiLevel === "expert"
                ? "Excellent! You're ready for advanced learning."
                : aiLevel === "intermediate"
                ? "Good job! Let’s take your skills to the next level."
                : "Don’t worry — we’ll build a roadmap to strengthen your fundamentals."}
            </p>

            <button
              onClick={handleGenerateRoadmap}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition"
            >
              Generate My Personalized Roadmap
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CareerTest;
