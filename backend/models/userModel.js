// models/userModel.js
import mongoose from "mongoose";

// --- Sub-document Schemas ---
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
});

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  tasks: [taskSchema],
});

const roadmapSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  milestones: [milestoneSchema],
});

// --- Main User Schema ---
const userSchema = new mongoose.Schema(
  {
    name: { type: String }, // for normal users
    displayName: String, // optional duplicate for Google users
    email: { type: String, required: true, unique: true },
    photoURL: String,

    // ✅ Added password (for normal auth)
    password: {
      type: String,
      required: function () {
        return !this.isGoogleUser; // required only if not Google user
      },
      select: false, // exclude from queries by default
    },

    // ✅ Flag for Google accounts
    isGoogleUser: {
      type: Boolean,
      default: false,
    },

    // Gamification Fields
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastTaskCompleted: { type: Date, default: null },
    earnedBadges: [
      {
        badgeId: { type: String, required: true },
        earnedAt: { type: Date, default: Date.now },
      },
    ],

    // Roadmaps
    roadmaps: [roadmapSchema],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
