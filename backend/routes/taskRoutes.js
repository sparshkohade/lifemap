import express from 'express';
import { completeTask } from '../controllers/taskController.js';
// import { protect } from '../middleware/authMiddleware.js'; // You'll add this later

const router = express.Router();

// Here's the endpoint.
// In a real app, you'd add 'protect' middleware before 'completeTask'
// router.patch('/complete', protect, completeTask);

router.patch('/complete', completeTask);

export default router;