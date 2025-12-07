// routes/userRoutes.js
import express from "express";
import { getUserByEmail } from "../controllers/userController.js";

const router = express.Router();

// GET /api/user/:email
router.get("/:email", getUserByEmail);

export default router;
