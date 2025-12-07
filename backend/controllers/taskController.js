import User from '../models/userModel.js';
import { updateStreak, checkBadges } from '../services/gamificationService.js';
import mongoose from 'mongoose';

/**
 * @desc    Mark a task as complete and trigger gamification
 * @route   PATCH /api/tasks/complete
 * @access  Private
 * * We expect a body like:
 * {
 * "roadmapId": "...",
 * "milestoneId": "...",
 * "taskId": "..."
 * }
 */
export const completeTask = async (req, res) => {
  // We get the user's ID from our auth middleware (e.g., JWT)
  // I'll assume it's available on req.user.id
  // const userId = req.user.id; 
  
  // FOR TESTING, let's get the user by email
  const { email, roadmapId, milestoneId, taskId } = req.body;

  if (!email || !roadmapId || !milestoneId || !taskId) {
    return res.status(400).json({ message: 'Missing required fields: email, roadmapId, milestoneId, taskId' });
  }
  
  try {
    // 1. Find the User
    // In a real app, you'd use: const user = await User.findById(req.user.id);
    const user = await User.findOne({ email: email }); 
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Find the specific task using the IDs
    const roadmap = user.roadmaps.id(roadmapId);
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });

    const milestone = roadmap.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    const task = milestone.tasks.id(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // 3. Check if task is already complete
    if (task.isCompleted) {
      return res.status(200).json({ message: 'Task already complete', user });
    }

    // 4. Mark task as complete
    task.isCompleted = true;
    task.completedAt = new Date();

    // 5. RUN THE GAMIFICATION ENGINE!
    updateStreak(user);
    await checkBadges(user, taskId);

    // 6. Save the entire user document back to the DB
    await user.save();

    // 7. Send the response
    res.status(200).json({
      message: 'Task completed successfully!',
      currentStreak: user.currentStreak,
      earnedBadges: user.earnedBadges
    });

  } catch (error) {
    console.error("Error completing task:", error);
    res.status(500).json({ message: 'Server error' });
  }
};