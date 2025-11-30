// frontend/src/pages/ExamPrep.jsx
import React, { useState, useContext } from "react";
import axios from "axios";
import { ThemeContext } from "../context/ThemeContext";

export default function ExamPrep() {
  const { theme } = useContext(ThemeContext);
  const [tab, setTab] = useState("question");
  const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Question Paper state
  const [subject, setSubject] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState("mixed");
  const [topics, setTopics] = useState("");
  const [paperResult, setPaperResult] = useState("");
  const [rawPaper, setRawPaper] = useState(null); // store server paper object
  const [loadingPaper, setLoadingPaper] = useState(false);

  // Interview Questions state
  const [jobDesc, setJobDesc] = useState("");
  const [numInterviewQ, setNumInterviewQ] = useState(10);
  const [interviewResult, setInterviewResult] = useState("");
  const [loadingInterview, setLoadingInterview] = useState(false);

  // Helper: Title-case a single word
  const titleCase = (s) =>
    String(s || "")
      .toLowerCase()
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");

  // Normalize topics string: split by comma, trim, title-case, join
  function normalizeTopics(raw) {
    if (!raw) return "";
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) =>
        // If a topic contains multiple words, title case each word
        t
          .split(" ")
          .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
          .join(" ")
      )
      .join(", ");
  }

  // Format paper; includeAnswers toggles whether answers are shown
  function formatPaper(paper, includeAnswers = false) {
    if (!paper) return "";

    const { topic, difficulty, topics: paperTopics, createdAt, questions } = paper;
    const normalizedTopics = paperTopics ? normalizeTopics(paperTopics) : "";

    let out = `Topic: ${topic || "N/A"}\nDifficulty: ${difficulty || "N/A"}\nTopics: ${normalizedTopics || "N/A"}\nCreated: ${createdAt || ""}\n\n`;

    if (!Array.isArray(questions)) return out + JSON.stringify(paper, null, 2);

    questions.forEach((q, idx) => {
      out += `${idx + 1}. ${q.question || q.text || q.prompt || "Question text missing"}\n`;
      if (q.options && Array.isArray(q.options)) {
        q.options.forEach((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          out += `   ${letter}. ${opt}\n`;
        });
      }
      // Only include answer in exported version (or if includeAnswers true)
      if (includeAnswers && q.answer) {
        out += `   Answer: ${q.answer}\n`;
      }
      out += `\n`;
    });

    return out.trim();
  }

  const generatePaper = async (e) => {
    e.preventDefault();
    setPaperResult("");
    setRawPaper(null);
    setLoadingPaper(true);

    try {
      const topic = (subject || "").toString().trim();
      const count =
        Number.isInteger(Number(numQuestions)) && Number(numQuestions) > 0 ? Number(numQuestions) : 10;
      // normalize topics before sending (keeps backend data tidy)
      const normalizedTopics = normalizeTopics(topics);

      const payload = {
        topic,
        count,
        difficulty,
        topics: normalizedTopics,
      };

      if (!payload.topic) {
        alert("Please enter a Subject (this becomes the topic for the paper).");
        setLoadingPaper(false);
        return;
      }

      console.log("[ExamPrep] POST payload:", payload);

      const resp = await axios.post(`${BACKEND}/api/examprep/question-paper`, payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      const data = resp.data || {};
      const paper = data.paper || data;

      // Keep raw object (for exporting with answers)
      setRawPaper(paper);

      // Format for on-screen display WITHOUT answers
      const formatted = formatPaper(paper, false);
      setPaperResult(formatted);

      console.log("[ExamPrep] server response:", resp.status, data);
    } catch (err) {
      console.error("[ExamPrep] generatePaper error:", err);
      const serverErr =
        err?.response?.data?.error || err?.response?.data || err.message || "Failed to generate paper";
      setPaperResult(typeof serverErr === "object" ? JSON.stringify(serverErr, null, 2) : serverErr);
    } finally {
      setLoadingPaper(false);
    }
  };

  // Download: if rawPaper exists, include answers in the exported file
  const handleDownloadPaper = () => {
    if (rawPaper) {
      const textWithAnswers = formatPaper(rawPaper, true);
      downloadText(`${(rawPaper.topic || subject || "paper").replace(/\s+/g, "-").toLowerCase()}-paper-with-answers.txt`, textWithAnswers);
    } else {
      // fallback to whatever is in textarea (no answers)
      downloadText(`${subject || "paper"}-paper.txt`, paperResult);
    }
  };

  // Generate Interview Questions
  const generateInterview = async (e) => {
    e.preventDefault();
    setInterviewResult("");
    setLoadingInterview(true);

    try {
      const payload = {
        jobDesc: (jobDesc || "").toString().trim(),
        count:
          Number.isInteger(Number(numInterviewQ)) && Number(numInterviewQ) > 0 ? Number(numInterviewQ) : 10,
      };

      if (!payload.jobDesc) {
        alert("Please enter a job description or role details.");
        setLoadingInterview(false);
        return;
      }

      const resp = await axios.post(`${BACKEND}/api/examprep/interview-questions`, payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      const data = resp.data || {};
      const interviewData = data.questions || data.interview || data;
      const formatted = formatInterview(interviewData);
      setInterviewResult(formatted);
    } catch (err) {
      console.error("[ExamPrep] generateInterview error:", err);
      const serverErr =
        err?.response?.data?.error || err?.response?.data || err.message || "Failed to generate questions";
      setInterviewResult(typeof serverErr === "object" ? JSON.stringify(serverErr, null, 2) : serverErr);
    } finally {
      setLoadingInterview(false);
    }
  };

  // Helper for formatting interview response (kept from earlier)
  function formatInterview(data) {
    if (!data) return "";
    if (typeof data === "string") return data;
    if (Array.isArray(data)) {
      return data.map((q, i) => `${i + 1}. ${typeof q === "string" ? q : q.question || JSON.stringify(q)}`).join("\n\n");
    }
    if (data.questions && Array.isArray(data.questions)) {
      return data.questions
        .map((q, i) => {
          if (typeof q === "string") return `${i + 1}. ${q}`;
          if (q.question) return `${i + 1}. ${q.question}\n   ${q.answer ? "Answer: " + q.answer : ""}`;
          return `${i + 1}. ${JSON.stringify(q)}`;
        })
        .join("\n\n");
    }
    return JSON.stringify(data, null, 2);
  }

  const downloadText = (filename, text) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Shared card style to match rest of app
  const cardBase = "rounded-2xl p-6 shadow-sm border ";
  const cardTheme =
    "bg-white border-gray-200 text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100";

  const sectionTitle = "text-lg font-semibold mb-2";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Exam & Interview Prep</h1>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setTab("question")}
          className={`px-4 py-2 rounded-full font-medium transition ${
            tab === "question"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          }`}
        >
          Question Paper
        </button>
        <button
          onClick={() => setTab("interview")}
          className={`px-4 py-2 rounded-full font-medium transition ${
            tab === "interview"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          }`}
        >
          Interview Questions
        </button>
      </div>

      <div className={`${cardBase}${cardTheme} mb-6`}>
        {tab === "question" ? (
          <form onSubmit={generatePaper} className="space-y-4">
            <div>
              <label className={sectionTitle}>Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="e.g. Physics, Data Structures"
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Number of Questions</label>
                <input
                  type="number"
                  min={1}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Topics (optional)</label>
              <input
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="Comma separated topics (e.g. arrays, trees)"
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                disabled={loadingPaper}
              >
                {loadingPaper ? "Generating..." : "Generate Paper"}
              </button>

              {paperResult && (
                <>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={handleDownloadPaper}
                  >
                    Download (with answers)
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => {
                      navigator.clipboard.writeText(paperResult);
                    }}
                  >
                    Copy
                  </button>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Result</label>
              <textarea
                readOnly
                value={paperResult}
                rows={12}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent font-mono text-sm"
              />
            </div>
          </form>
        ) : (
          <form onSubmit={generateInterview} className="space-y-4">
            <div>
              <label className={sectionTitle}>Job description / Role</label>
              <textarea
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                placeholder="Paste a job description or write the role and required skills"
                required
                rows={6}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Number of Questions</label>
              <input
                type="number"
                min={1}
                value={numInterviewQ}
                onChange={(e) => setNumInterviewQ(Number(e.target.value))}
                className="w-32 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                disabled={loadingInterview}
              >
                {loadingInterview ? "Generating..." : "Generate Interview Questions"}
              </button>
              {interviewResult && (
                <>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => downloadText(`interview-questions.txt`, interviewResult)}
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => {
                      navigator.clipboard.writeText(interviewResult);
                    }}
                  >
                    Copy
                  </button>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Result</label>
              <textarea
                readOnly
                value={interviewResult}
                rows={12}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent font-mono text-sm"
              />
            </div>
          </form>
        )}
      </div>

      {/* Small tips card to blend in with other pages */}
      <div className={`${cardBase}${cardTheme} text-sm`}>
        <p className="text-gray-600 dark:text-gray-300">
          Tip: For better quality, include specific topics or paste a detailed job description. Protect endpoints with auth in production to avoid abuse.
        </p>
      </div>
    </div>
  );
}
