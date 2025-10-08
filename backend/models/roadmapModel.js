// models/roadmapModel.js
import mongoose from "mongoose";

const StepSchema = new mongoose.Schema({
  title: String,
  description: String,
  estimatedTime: String, // e.g., "2 months"
});

const RoadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  goal: { type: String, required: true },
  steps: [StepSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Roadmap", RoadmapSchema);
