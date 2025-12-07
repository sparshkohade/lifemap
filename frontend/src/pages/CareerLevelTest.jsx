// frontend/src/pages/CareerLevelTestAI.jsx
import React, { useState, useEffect } from "react";

export default function CareerLevelTestAI({ domain }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchQuestion = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:5000/api/quiz/next", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, answers: questions }),
    });
    const data = await res.json();
    setQuestions([...questions, data]);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestion(); // load first question
  }, []);

  const handleAnswer = (answer) => {
    const updated = [...questions];
    updated[updated.length - 1].userAnswer = answer;
    setQuestions(updated);

    // Fetch next question
    fetchQuestion();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-xl w-full bg-white p-8 rounded-xl shadow-lg">
        {loading && <p className="text-gray-600">Loading question...</p>}

        {!loading && questions.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-4">
              {questions[questions.length - 1].question}
            </h2>
            <div className="space-y-2">
              {questions[questions.length - 1].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className="w-full text-left px-4 py-2 border rounded-lg hover:bg-blue-50"
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
