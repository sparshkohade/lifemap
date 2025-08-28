import React, { useState } from "react";

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Fetch AI-generated question
  const fetchQuestion = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/quiz/next");
      const data = await res.json();
      setQuestions((prev) => [...prev, data]);
    } catch (err) {
      console.error("Error fetching question:", err);
    }
  };

  // Handle answer selection
  const handleAnswer = (answerIndex) => {
    const lastQ = questions[currentQ];
    const weights = lastQ.weights || [];
    setScore((prev) => prev + (weights[answerIndex] || 0));

    if (currentQ + 1 < 5) {
      setCurrentQ((prev) => prev + 1);
      fetchQuestion();
    } else {
      setFinished(true);
    }
  };

  // Map score → career level
  const getLevel = () => {
    if (score <= 3) return "Beginner";
    if (score <= 7) return "Intermediate";
    return "Advanced";
  };

  // Start quiz
  const startQuiz = () => {
    setQuestions([]);
    setScore(0);
    setFinished(false);
    setCurrentQ(0);
    fetchQuestion();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {!questions.length && !finished && (
        <button
          onClick={startQuiz}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Start Quiz
        </button>
      )}

      {questions.length > 0 && !finished && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">
            Q{currentQ + 1}: {questions[currentQ].question}
          </h2>
          <div className="space-y-3">
            {questions[currentQ].options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className="w-full px-4 py-2 text-left border rounded-lg hover:bg-blue-100 transition"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {finished && (
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">Quiz Finished 🎉</h2>
          <p className="text-lg">
            Based on your answers, your career level is:{" "}
            <span className="font-semibold text-blue-600">{getLevel()}</span>
          </p>
          <button
            onClick={startQuiz}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  );
}
