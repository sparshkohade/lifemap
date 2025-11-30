// backend/utils/generateAIQuestions.js
import axios from "axios";

/**
 * generateAIQuestions (OpenAI-compatible fallback)
 *
 * Behavior:
 * - If process.env.OPENAI_API_KEY is set -> call OpenAI-compatible chat completions (v1/chat/completions)
 * - Otherwise return [] (caller should fallback to mock generator)
 *
 * This file intentionally does not depend on Google ADC/Vertex. If you later want Vertex,
 * replace or extend callModelAPI with the Vertex implementation.
 *
 * Env:
 *  - OPENAI_API_KEY (optional)
 *  - OPENAI_BASE_URL (optional, defaults to https://api.openai.com)
 *  - AI_MODEL (optional, defaults to "gpt-4o-mini" or "gpt-4o" per your access)
 */

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_BASE = (process.env.OPENAI_BASE_URL || process.env.OPENAI_BASE || "https://api.openai.com").replace(/\/$/, "");
const MODEL = process.env.AI_MODEL || "gpt-4o-mini";

/** Build strict JSON-only prompt */
function buildPrompt({ topic, difficulty = "medium", count = 6 }) {
  return `
You are an expert exam question writer for computer science and engineering topics.
Produce exactly ${count} multiple-choice questions about "${topic}" with the requested difficulty: "${difficulty}".
Return output as a JSON array only, with each item having these fields:
- questionText (string)
- options (array of 3-5 strings)
- correctAnswer (string which must exactly match one of the options)
- explanation (short string)
- difficulty (easy|medium|hard)

Example:
[
  {"questionText":"...","options":["A","B","C","D"],"correctAnswer":"A","explanation":"...","difficulty":"medium"},
  ...
]

Do not include any preface, commentary, or extra text — output valid JSON only.
`.trim();
}

/** sanitize item */
function sanitizeItem(item) {
  return {
    questionText: (item.questionText || item.question || "").toString().trim(),
    options: Array.isArray(item.options) ? item.options.map(String).map(s => s.trim()).filter(Boolean) : [],
    correctAnswer: (item.correctAnswer || item.answer || "").toString().trim(),
    explanation: (item.explanation || "").toString().trim(),
    difficulty: (item.difficulty || "medium").toString().toLowerCase(),
  };
}

/** Try to extract JSON array from a text */
function extractJsonArrayFromText(text) {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    const arr = Object.values(parsed).find(v => Array.isArray(v));
    if (Array.isArray(arr)) return arr;
  } catch (e) {
    const m = text.match(/(\[\s*{[\s\S]*}\s*\])/m);
    if (m) {
      try {
        const p = JSON.parse(m[1]);
        if (Array.isArray(p)) return p;
      } catch (_) {}
    }
  }
  return null;
}

/** Call OpenAI-compatible chat completions endpoint */
async function callOpenAI(prompt, { temperature = 0.2, max_tokens = 1200 } = {}) {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not configured");

  const url = `${OPENAI_BASE}/v1/chat/completions`;

  const payload = {
    model: MODEL,
    messages: [
      { role: "system", content: "You are a helpful exam question generator." },
      { role: "user", content: prompt }
    ],
    temperature,
    max_tokens,
    n: 1,
  };

  const headers = {
    Authorization: `Bearer ${OPENAI_KEY}`,
    "Content-Type": "application/json",
  };

  const resp = await axios.post(url, payload, { headers, timeout: 45000 });
  return resp.data;
}

/** Main exported function */
export default async function generateAIQuestions({ topic, difficulty = "medium", count = 6 }) {
  // If no API key, return empty array so controller falls back to mock
  if (!OPENAI_KEY) {
    console.warn("[generateAIQuestions] OPENAI_API_KEY not set — skipping AI generation (falling back to mock).");
    return [];
  }

  try {
    const prompt = buildPrompt({ topic, difficulty, count });
    const resp = await callOpenAI(prompt, { temperature: 0.2, max_tokens: 1500 });

    // Typical response: resp.choices[0].message.content
    const choices = resp?.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const content = choices[0].message?.content ?? choices[0].text ?? "";
      // Try to parse JSON directly
      let arr = extractJsonArrayFromText(content);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.slice(0, count).map(sanitizeItem);
      }

      // If not JSON, try to find JSON substring
      const combined = JSON.stringify(resp);
      arr = extractJsonArrayFromText(combined);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.slice(0, count).map(sanitizeItem);
      }

      // last resort: return empty so controller will fallback to mock
      console.warn("[generateAIQuestions] OpenAI returned non-JSON content; falling back to mock.");
      console.log("[generateAIQuestions] raw content snippet:", String(content).slice(0, 1000));
      return [];
    }

    console.warn("[generateAIQuestions] unexpected OpenAI response shape; falling back to mock.");
    console.log("[generateAIQuestions] resp:", JSON.stringify(resp).slice(0, 1200));
    return [];
  } catch (err) {
    console.error("[generateAIQuestions] error calling OpenAI:", err?.response?.data ?? err?.message ?? err);
    // Don't throw — return empty so controller falls back to mock
    return [];
  }
}
