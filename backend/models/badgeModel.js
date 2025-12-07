// models/badgeModel.js
import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema({
  /**
   * A unique ID for the badge (e.g., 'first-goal', '7-day-streak').
   * We use this in the user's 'earnedBadges' array.
   */
  badgeId: {
    type: String,
    required: true,
    unique: true,
    index: true // Good for quick lookups
  },
  
  /**
   * The display name of the badge (e.g., "Goal Getter").
   */
  name: {
    type: String,
    required: true
  },
  
  /**
   * A short description (e.g., "You completed your first goal!").
   */
  description: {
    type: String,
    required: true
  },
  
  /**
   * The name or URL of the icon to display on the frontend.
   * (e.g., 'star-icon.png' or 'https://cdn.example.com/star-icon.png')
   */
  icon: {
    type: String,
    required: true
  }
});

export default mongoose.model("Badge", badgeSchema); 