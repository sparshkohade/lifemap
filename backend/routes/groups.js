// backend/routes/groups.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import Group from "../models/group.js";

const router = express.Router();

/* ----------------- uploads dir setup ----------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../uploads/posts");
fs.mkdirSync(uploadsDir, { recursive: true });

/* ----------------- multer setup ----------------- */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-").toLowerCase();
    const unique = `${base}-${Date.now()}${ext}`;
    cb(null, unique);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
  fileFilter: (_req, file, cb) => {
    // allow images and common docs
    const allowed = /jpeg|jpg|png|gif|webp|pdf|docx|pptx/;
    const mimetypeOk = allowed.test(file.mimetype);
    const extOk = allowed.test(path.extname(file.originalname).slice(1).toLowerCase());
    if (mimetypeOk && extOk) return cb(null, true);
    cb(new Error("Unsupported file type"));
  }
});

/* ----------------- Routes ----------------- */

// GET all groups
router.get("/", async (_req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET single group
router.get("/:id", async (req, res) => {
  try {
    const g = await Group.findById(req.params.id);
    if (!g) return res.status(404).json({ error: "Not found" });
    res.json(g);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ----------------- CREATE group ----------------- */
/*
  POST /api/groups
  Body (JSON):
  {
    name: string,
    topic?: string,
    description?: string,
    location?: string,
    owner: { name, email }
  }
*/
router.post("/", async (req, res) => {
  try {
    const { name, topic, description, location, owner } = req.body;

    if (!name || !owner || !owner.email) {
      return res.status(400).json({ error: "Name and owner (with email) are required" });
    }

    const group = await Group.create({
      name,
      topic: topic || "general",
      description: description || "",
      location: location || "",
      owner,
      members: owner?.email ? [{ name: owner.name, email: owner.email }] : []
    });

    return res.status(201).json(group);
  } catch (err) {
    console.error("Create group error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
});

/* ----------------- Posts (create post / announcement) ----------------- */
/*
  POST /api/groups/:id/posts
  Accepts multipart/form-data:
    - files[] (images/docs)
    - author (stringified JSON)
    - content
    - link (optional)
    - isAnnouncement ("true" or boolean)
*/
router.post("/:id/posts", upload.array("files", 4), async (req, res) => {
  try {
    const { author, content, link, isAnnouncement } = req.body;
    const g = await Group.findById(req.params.id);
    if (!g) return res.status(404).json({ error: "Not found" });

    // parse author object if provided
    const authorObj = author ? JSON.parse(author) : null;

    // parse isAnnouncement flag (multipart sends strings)
    const announcementFlag = isAnnouncement === "true" || isAnnouncement === true;

    // If trying to post an announcement, ensure author is the group owner
    if (announcementFlag) {
      if (!authorObj || !g.owner || authorObj.email !== g.owner.email) {
        return res.status(403).json({ error: "Only the group owner can create announcements" });
      }
    }

    const attachments = [];

    if (req.files && req.files.length) {
      req.files.forEach((f) => {
        // saved filename on disk
        const stored = f.filename;         // e.g. "2-1762411501517.png"
        const original = f.originalname;   // e.g. "2.png"
        const url = `/uploads/posts/${stored}`;
        attachments.push({
          type: f.mimetype.startsWith("image") ? "image" : "file",
          url,                    // exact public URL for this saved file
          name: original,         // user-visible filename
          fileName: stored,       // store actual saved filename too (helpful)
        });
      });
    }

    if (link && typeof link === "string" && link.trim()) {
      attachments.push({
        type: "link",
        url: link.trim(),
        name: link.trim(),
      });
    }

    g.posts.push({
      author: authorObj,
      content: content || "",
      attachments,
      isAnnouncement: announcementFlag,
      createdAt: new Date(),
    });

    await g.save();
    res.json(g);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err?.message || "Server error" });
  }
});

// JOIN group
router.post("/:id/join", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const g = await Group.findById(req.params.id);
    if (!g) return res.status(404).json({ error: "Not found" });

    const exists = g.members.find(m => m.email === email);
    if (!exists) g.members.push({ email, name });
    await g.save();
    res.json(g);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// LEAVE group
router.post("/:id/leave", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const g = await Group.findById(req.params.id);
    if (!g) return res.status(404).json({ error: "Not found" });

    g.members = g.members.filter(m => m.email !== email);
    await g.save();
    res.json(g);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ----------------- Reports & Delete ----------------- */

// DELETE group (owner only)
router.delete("/:id", async (req, res) => {
  try {
    const { author } = req.body; // expect JSON { author: { email, name } }
    const g = await Group.findById(req.params.id);
    if (!g) return res.status(404).json({ error: "Not found" });

    const authorObj = author ? JSON.parse(author) : null;
    if (!authorObj || authorObj.email !== g.owner?.email) {
      return res.status(403).json({ error: "Only the group owner can delete this group" });
    }

    await Group.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// REPORT group (any member can report)
router.post("/:id/report", async (req, res) => {
  try {
    const { reporter, reason } = req.body; // reporter: { name, email }
    if (!reporter || !reporter.email) return res.status(400).json({ error: "Reporter required" });

    const g = await Group.findById(req.params.id);
    if (!g) return res.status(404).json({ error: "Not found" });

    g.reports.push({
      reporter,
      reason: reason || "No reason provided",
      createdAt: new Date(),
    });

    await g.save();

    // Optionally: notify admins or log externally — keep simple for now
    res.json({ success: true, message: "Report submitted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
