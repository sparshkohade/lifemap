// models/userModel.js
import mongoose from "mongoose";

// --- Sub-document Schemas ---
// We define the nested schemas first.
// These are NOT separate models, but structures for your arrays.

// The smallest unit, as defined in your synopsis
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  // 'completedAt' will be set by the server when isCompleted is set to true
  completedAt: { type: Date, default: null } 
});

// A collection of tasks, which you call a "milestone"
const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  tasks: [taskSchema] // An array of tasks
});

// A "Roadmap" is a collection of milestones
const roadmapSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  milestones: [milestoneSchema] // Your 'steps' array is now a structured 'milestones' array
});


// --- Main User Schema ---
// Now we build the final User model

const userSchema = new mongoose.Schema({
  // Your existing fields
  displayName: String,
  email: { type: String, required: true, unique: true },
  photoURL: String,

  // --- Gamification Fields (as planned) ---
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastTaskCompleted: { // The date of the last completed task
    type: Date,
    default: null
  },
  earnedBadges: [
    {
      badgeId: { type: String, required: true }, // e.g., "7-day-streak"
      earnedAt: { type: Date, default: Date.now }
    }
  ],
  
  // --- Your Revised Roadmap Structure ---
  roadmaps: [roadmapSchema] // Use the structured roadmapSchema

}, { 
  // Good practice to add timestamps
  timestamps: true 
});

export default mongoose.model("User", userSchema);