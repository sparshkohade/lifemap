// backend/controllers/authController.js
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("../config/serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// 🔐 Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ✅ Register (manual signup)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists. Please log in instead." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isGoogleUser: false,
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

// ✅ Login (manual email/password)
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    // Include password explicitly since it's select:false
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(400)
        .json({ message: "No account found with this email" });
    }

    // Google accounts cannot log in with password
    if (user.isGoogleUser) {
      return res.status(400).json({
        message:
          "This account was created using Google Sign-In. Please use Google login.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

// ✅ Google Auth (Firebase)
export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token)
      return res.status(400).json({ message: "Missing Google token" });

    // Verify token with Firebase Admin
    const decoded = await admin.auth().verifyIdToken(token);

    let user = await User.findOne({ email: decoded.email });

    // If not found, create new Google user
    if (!user) {
      user = await User.create({
        name: decoded.name || decoded.email.split("@")[0],
        displayName: decoded.name || "",
        email: decoded.email,
        photoURL: decoded.picture || "",
        isGoogleUser: true,
      });
    }

    // Generate your own JWT for app session
    const appToken = generateToken(user._id);

    return res.json({
      _id: user._id,
      name: user.name || user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      token: appToken,
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(400).json({
      message: "Google login failed",
      error: error.message,
    });
  }
};
