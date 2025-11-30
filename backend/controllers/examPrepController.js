// backend/controllers/examPrepController.js
import Question from "../models/question.js";
import generateAIQuestions from "../utils/generateAIQuestions.js";

/** deterministic mock generator */
export async function generateQuestionPaper(payload = {}) {
  const topic = (payload.topic || payload.subject || "").toString().trim();
  const count =
    Number.isInteger(Number(payload.count)) && Number(payload.count) > 0
      ? Number(payload.count)
      : 5;
  const difficulty = payload.difficulty ? String(payload.difficulty) : "mixed";
  const topics = payload.topics ? String(payload.topics) : "";

  if (!topic) {
    const err = new Error("Missing or invalid 'topic' (string required)");
    err.status = 400;
    throw err;
  }

  const questions = [];
  for (let i = 1; i <= count; i++) {
    questions.push({
      id: `mock-${topic.replace(/\s+/g, "_").toLowerCase()}-${i}`,
      question: `(${topic}) Sample question #${i} — difficulty: ${difficulty}${topics ? ` — topics: ${topics}` : ""}`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      answer: "Option A",
      difficulty,
    });
  }

  return {
    topic,
    difficulty,
    topics,
    createdAt: new Date().toISOString(),
    source: "mock",
    questions,
  };
}

/** remove answers unless keepAnswers=true */
function stripAnswersFromPaper(paper, { keepAnswers = false } = {}) {
  if (!paper || !Array.isArray(paper.questions)) return paper;
  const qCopy = paper.questions.map((q) => {
    const out = {
      id: q.id || q._id || null,
      question: q.questionText || q.question || "",
      options: q.options || [],
      difficulty: q.difficulty || "medium",
      explanation: q.explanation || "",
    };
    if (keepAnswers) out.answer = q.answer || q.correctAnswer || null;
    return out;
  });
  return { ...paper, questions: qCopy };
}

/** safe RegExp escape helper */
function escapeRegExp(string = "") {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Express route handler */
export async function generateQuestionPaperHandler(req, res, next) {
  try {
    const body = (req && req.body) ? req.body : {};
    const topic = (typeof body.topic === "string" && body.topic.trim())
      ? body.topic.trim()
      : (typeof body.subject === "string" && body.subject.trim()) ? body.subject.trim() : null;

    const count = Number.isInteger(Number(body.count)) && Number(body.count) > 0 ? Number(body.count) : 5;
    const difficulty = body.difficulty || "mixed";
    const topics = body.topics || "";
    const regenerate = (body.regenerate === true || String(body.regenerate) === "true");
    const persist = (body.persist === true || String(body.persist) === "true");
    const keepAnswers = (body.keepAnswers === true || String(body.keepAnswers) === "true");

    if (!topic) {
      return res.status(400).json({ success: false, error: "Missing or invalid 'topic' (string required)" });
    }

    let paper = null;
    let fetchedFrom = null;

    // DB-first when persist requested
    if (persist) {
      const dbFilter = { topic: { $regex: new RegExp(topic, "i") } };
      if (difficulty && difficulty !== "mixed") dbFilter.difficulty = difficulty;
      const dbQuestions = await Question.find(dbFilter).limit(count).lean();
      if (dbQuestions && dbQuestions.length >= count && !regenerate) {
        const questions = dbQuestions.map((q) => ({
          id: q._id,
          question: q.questionText || q.question || "",
          options: q.options || [],
          answer: q.correctAnswer || q.answer || null,
          explanation: q.explanation || "",
          difficulty: q.difficulty || difficulty || "medium",
        }));
        paper = {
          topic,
          difficulty,
          topics,
          createdAt: new Date().toISOString(),
          source: "db",
          questions,
        };
        fetchedFrom = "db";
      }
    }

    // AI generation (Gemini via Vertex)
    if (!paper) {
      let aiItems = [];
      try {
        aiItems = await generateAIQuestions({ topic, difficulty: difficulty === "mixed" ? "medium" : difficulty, count });
      } catch (err) {
        console.error("AI generation failed:", err && (err.stack || err.message || err));
        aiItems = [];
      }

      const valid = (aiItems || []).filter(it => {
        const qText = (it.questionText || it.question || "").toString().trim();
        const opts = Array.isArray(it.options) ? it.options.filter(Boolean) : [];
        const correct = (it.correctAnswer || it.answer || "").toString().trim();
        return qText && opts.length >= 2 && correct && opts.includes(correct);
      }).map((it, idx) => ({
        id: it.id || it._id || `ai-${Date.now()}-${idx}`,
        question: (it.questionText || it.question || "").toString().trim(),
        options: (it.options || []).map(String),
        answer: (it.correctAnswer || it.answer || "").toString().trim(),
        explanation: it.explanation || "",
        difficulty: it.difficulty || difficulty || "medium",
      }));

      if (valid.length > 0) {
        paper = {
          topic,
          difficulty,
          topics,
          createdAt: new Date().toISOString(),
          source: "ai",
          questions: valid.slice(0, count),
        };

        // persist AI results if requested
        if (persist) {
          const toInsert = [];
          for (const q of paper.questions) {
            const exists = await Question.findOne({
              topic: { $regex: new RegExp(`^${escapeRegExp(topic)}$`, "i") },
              questionText: { $regex: new RegExp(`^${escapeRegExp(q.question)}$`, "i") },
            });
            if (!exists) {
              toInsert.push({
                topic,
                questionText: q.question,
                options: q.options,
                correctAnswer: q.answer,
                explanation: q.explanation,
                difficulty: q.difficulty || "medium",
                createdAt: new Date(),
                source: "ai",
              });
            }
          }
          if (toInsert.length > 0) {
            try {
              await Question.insertMany(toInsert, { ordered: false });
            } catch (e) {
              console.warn("Partial/failed insert during AI persist:", e && e.message ? e.message : e);
            }
          }
        }
        fetchedFrom = "ai";
      }
    }

    // Fallback mock
    if (!paper) {
      paper = await generateQuestionPaper({ topic, count, difficulty, topics });
      fetchedFrom = "mock";
    }

    const safePaper = stripAnswersFromPaper(paper, { keepAnswers });

    return res.status(200).json({
      success: true,
      meta: {
        topic,
        count: (safePaper.questions || []).length,
        source: fetchedFrom,
        persisted: persist,
      },
      paper: safePaper,
    });
  } catch (err) {
    console.error("generateQuestionPaper error:", err && (err.stack || err.message || err));
    const status = err && err.status && Number(err.status) ? Number(err.status) : 500;
    return res.status(status).json({ success: false, error: err.message || "Server error" });
  }
}
