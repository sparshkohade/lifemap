// backend/models/roadmapModel.js
import mongoose from "mongoose";

/* ---------------------------------------------------
 🧩 Step Schema
--------------------------------------------------- */
const StepSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Step title is required"],
      trim: true,
      minlength: [3, "Step title must be at least 3 characters long"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    estimatedTime: {
      type: String,
      trim: true,
      match: /^[\w\s\d]+$/i, // basic validation (e.g., "2 months", "6 weeks")
      default: "Unspecified",
    },
    // Optional future-proofing: add progress tracking per step
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false } // keep subdocuments lightweight
);

/* ---------------------------------------------------
 🎯 Roadmap Schema
--------------------------------------------------- */
const RoadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    goal: {
      type: String,
      required: [true, "Goal is required"],
      trim: true,
    },
    steps: {
      type: [StepSchema],
      validate: [
        (val) => val.length > 0,
        "A roadmap must contain at least one step.",
      ],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true, // cannot change after creation
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // auto manages createdAt & updatedAt
);

/* ---------------------------------------------------
 🧠 Middleware
--------------------------------------------------- */
// Automatically update `updatedAt` before save (for manual updates)
RoadmapSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

/* ---------------------------------------------------
 ✅ Export
--------------------------------------------------- */
export default mongoose.model("Roadmap", RoadmapSchema);
