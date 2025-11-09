// backend/models/roadmapModel.js
import mongoose from "mongoose";

/* ---------------------------------------------------
 🧩 Step Schema
--------------------------------------------------- */
const StepSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  startDate: Date, // optional — helps Gantt
  endDate: Date, // optional — helps Gantt
  durationDays: Number,
  order: Number,
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Step' }],
});

/* ---------------------------------------------------
 🎯 Roadmap Schema
--------------------------------------------------- */
const RoadmapSchema = new mongoose.Schema({
  title: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  meta: {
    domain: String,
    roleType: { type: String, enum: ['student','professional','other'], default: 'other' },
    studentYear: String,
    company: String,
    jobDomain: String,
    timelineUnits: { type: String, enum: ['days','weeks','months','years'], default: 'weeks' },
    timelineLength: Number, // number in chosen units
  },
  steps: [StepSchema]
});

/* ---------------------------------------------------
 🧠 Middleware
--------------------------------------------------- */
// Automatically update `updatedAt` before save (for manual updates)
RoadmapSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// index to speed up user lookups
RoadmapSchema.index({ user: 1, createdAt: -1 });

/* ---------------------------------------------------
 ✅ Export
--------------------------------------------------- */
export default mongoose.model("Roadmap", RoadmapSchema);
