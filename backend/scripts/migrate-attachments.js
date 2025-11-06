// backend/scripts/migrate-attachments.js
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/lifemap";
const uploadsDir = path.join(process.cwd(), "uploads", "posts"); // run from backend/

// adjust path to your Group model
import Group from "../models/group.js";

async function run() {
  console.log("Connecting to DB:", MONGO_URI);
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected.");

  if (!fs.existsSync(uploadsDir)) {
    console.error("Uploads dir not found:", uploadsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(uploadsDir);
  console.log("Found files:", files.length);

  const groups = await Group.find();
  console.log("Groups to scan:", groups.length);

  let totalUpdated = 0;

  for (const g of groups) {
    let changed = false;
    if (!g.posts || g.posts.length === 0) continue;

    for (const post of g.posts) {
      if (!post.attachments || post.attachments.length === 0) continue;

      for (const a of post.attachments) {
        // if url already points to an existing file, skip
        if (a.url && fs.existsSync(path.join(process.cwd(), a.url.replace(/^\//, "")))) continue;

        // derive the original name candidate from a.name or the trailing part of a.url
        const trailing = a.name || (a.url && a.url.split("/").pop());
        if (!trailing) continue;

        // find any file that starts with `${trailing.split('.')[0]}-` (prefix match)
        const base = trailing.includes(".") ? trailing.split(".")[0] : trailing;
        const match = files.find(f => f.startsWith(`${base}-`));

        if (match) {
          const newUrl = `/uploads/posts/${match}`;
          console.log(`Group ${g._id}: updating attachment ${trailing} -> ${match}`);
          a.url = newUrl;
          a.fileName = match;
          changed = true;
          totalUpdated++;
        } else {
          // no match found — maybe the file never saved; log it
          // console.log(`No match on disk for ${trailing}`);
        }
      }
    }

    if (changed) {
      await g.save();
      console.log("Saved group", g._id);
    }
  }

  console.log("Migration complete. total updated attachments:", totalUpdated);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
