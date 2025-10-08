// models/userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  displayName: String,
  email: { type: String, required: true, unique: true },
  photoURL: String,
  roadmaps: [
    {
      title: String,
      description: String,
      steps: Array,
    },
  ],
});

export default mongoose.model("User", userSchema);
