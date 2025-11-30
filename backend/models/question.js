// backend/models/question.js
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  topic: { type: String, required: true, index: true },
  questionText: { type: String, required: true, index: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String, default: "" },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  source: { type: String, default: "db" }, // db | ai | mock
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Question", questionSchema);
