import User from '../models/userModel.js';
import Badge from '../models/badgeModel.js';
// We might need our task model if we change the schema, but for now, we'll get tasks from the user
// import Task from '../models/taskModel.js'; 

/**
 * Checks if two dates are on the same calendar day.
 * @param {Date} d1 - First date
 * @param {Date} d2 - Second date
 * @returns {boolean}
 */
const isSameDay = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

/**
 * Checks if a date is yesterday relative to another.
 * @param {Date} date - The date to check
 * @param {Date} today - The "current" date (usually new Date())
 * @returns {boolean}
 */
const isYesterday = (date, today) => {
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return isSameDay(date, yesterday);
};

/**
 * Updates the user's streak based on the last completed task.
 * This function MUTATES the user object.
 * @param {Document<User>} user - The Mongoose user document.
 */
export const updateStreak = (user) => {
  const today = new Date();
  const lastCompleted = user.lastTaskCompleted;

  if (!lastCompleted) {
    // First task ever completed
    user.currentStreak = 1;
  } else if (isSameDay(lastCompleted, today)) {
    // Already completed a task today. Streak doesn't change.
    console.log("Streak: Already completed a task today.");
    return; // Exit
  } else if (isYesterday(lastCompleted, today)) {
    // Consecutive day!
    user.currentStreak += 1;
  } else {
    // Missed a day (or more). Reset streak.
    user.currentStreak = 1;
  }

  // Update longest streak if current is greater
  if (user.currentStreak > user.longestStreak) {
    user.longestStreak = user.currentStreak;
  }

  // IMPORTANT: Set the last completed date to now
  user.lastTaskCompleted = today;
  console.log(`Streak updated: ${user.currentStreak}`);
};

/**
 * Checks and awards new badges to the user.
 * This function MUTATES the user object.
 * @param {Document<User>} user - The Mongoose user document.
 * @param {string} completedTaskId - The ID of the task that was just completed.
 */
export const checkBadges = async (user, completedTaskId) => {
  try {
    const earnedBadgeIds = user.earnedBadges.map(b => b.badgeId);

    // --- Check for 'first-task' ---
    const firstTaskBadge = 'first-task';
    if (!earnedBadgeIds.includes(firstTaskBadge)) {
      // We can assume if they are in this function, they completed a task.
      // A more robust check would count all completed tasks.
      user.earnedBadges.push({ badgeId: firstTaskBadge, earnedAt: new Date() });
      console.log("Badge earned: First Task!");
    }

    // --- Check for '7-day-streak' ---
    const streakBadge = '7-day-streak';
    if (!earnedBadgeIds.includes(streakBadge) && user.currentStreak >= 7) {
      user.earnedBadges.push({ badgeId: streakBadge, earnedAt: new Date() });
      console.log("Badge earned: 7-Day Streak!");
    }

    // --- Check for '10-tasks-completed' ---
    // This is more complex logic. We need to count all completed tasks.
    const tenTaskBadge = '10-tasks';
    if (!earnedBadgeIds.includes(tenTaskBadge)) {
      let completedCount = 0;
      user.roadmaps.forEach(roadmap => {
        roadmap.milestones.forEach(milestone => {
          milestone.tasks.forEach(task => {
            if (task.isCompleted) {
              completedCount++;
            }
          });
        });
      });

      if (completedCount >= 10) {
        user.earnedBadges.push({ badgeId: tenTaskBadge, earnedAt: new Date() });
        console.log("Badge earned: 10 Tasks Completed!");
      }
    }

    // Add more badge checks here...

  } catch (error) {
    console.error("Error checking badges:", error);
    // Don't block the main request if badge check fails
  }
};