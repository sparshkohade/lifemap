// frontend/src/components/KnowledgeTest.jsx
import React, { useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";

export default function KnowledgeTest({ goal, onLevelDetected }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const fetchQuestions = async () => {
    setLoading(true);
    setQuestions([]);
    setResult(null);

    try {
      const res = await axios.post("http://localhost:5000/api/roadmap/quiz", { goal });
      setQuestions(res.data.questions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const userAnswers = Object.values(answers);
    if (userAnswers.length < questions.length) {
      alert("Please answer all questions.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/roadmap/evaluate", {
        goal,
        answers: userAnswers,
      });
      setResult(res.data.level);
      onLevelDetected(res.data.level); // send detected level back to parent (Roadmap.jsx)
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md space-y-4">
      <h2 className="text-xl font-semibold text-center mb-2">
        🧠 Knowledge Assessment for "{goal}"
      </h2>

      {!questions.length && !result && (
        <button
          onClick={fetchQuestions}
          disabled={loading}
          className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition w-full"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" /> : "Start Test"}
        </button>
      )}

      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="p-4 border rounded-xl dark:border-gray-700">
              <p className="font-medium mb-2">{i + 1}. {q.question}</p>
              {q.options.map((opt, j) => (
                <label key={j} className="block">
                  <input
                    type="radio"
                    name={`q${i}`}
                    value={opt}
                    onChange={() => setAnswers({ ...answers, [i]: opt })}
                    className="mr-2"
                  />
                  {opt}
                </label>
              ))}
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-xl w-full hover:bg-green-700 transition"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Submit Answers"}
          </button>
        </div>
      )}

      {result && (
        <div className="text-center mt-4">
          <p className="text-lg">
            ✅ Your skill level is: <span className="font-bold capitalize">{result}</span>
          </p>
        </div>
      )}
    </div>
  );
}
