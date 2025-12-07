// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

/**
 * protect - middleware that verifies a JWT and attaches req.user
 * Accepts token from:
 *   1) Authorization: Bearer <token>
 *   2) Cookie named "token" (req.cookies.token) - requires cookie-parser in server.js
 *
 * Usage:
 *   import { protect } from '../middleware/authMiddleware.js';
 *   router.get('/private', protect, handler);
 *
 * The token payload should include `id` (or `_id`) for the user identifier.
 */
export async function protect(req, res, next) {
  try {
    // Try header first (existing behavior)
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    let token = null;

    if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // Fallback: check cookie (requires cookie-parser middleware)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const secret = process.env.JWT_SECRET || "dev-secret";
    try {
      const payload = jwt.verify(token, secret);

      // Attach basic user info to request — adapt if your payload shape differs
      req.user = {
        id: payload.id || payload._id,
        email: payload.email,
        role: payload.role,
        // include the rest of payload if needed (careful about sensitive fields)
        ...payload,
      };

      return next();
    } catch (err) {
      console.error("authMiddleware.protect - token verify error:", err.message || err);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  } catch (err) {
    console.error("authMiddleware.protect error", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * admin - optional role-check middleware example
 * Use like: router.get('/admin-only', protect, admin, handler)
 */
export function admin(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
    return next();
  } catch (err) {
    console.error("authMiddleware.admin error", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// default export for older imports: import auth from './authMiddleware.js'
export default protect;
