import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, enum: ["Career", "Education", "Health", "Finance", "Other"], default: "Career" },
    status: { type: String, enum: ["active", "completed", "archived"], default: "active" },
    startDate: { type: Date },
    endDate: { type: Date }
  },
  { timestamps: true }
);

const Goal = mongoose.model("Goal", goalSchema);
export default Goal;
