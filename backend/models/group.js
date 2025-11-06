// backend/models/group.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const MemberSchema = new Schema(
  {
    name: String,
    email: { type: String, required: true },
  },
  { _id: false }
);

const AttachmentSchema = new Schema(
  {
    type: String, // 'image' | 'file' | 'link'
    url: String,
    name: String,
    fileName: String,
  },
  { _id: false }
);

const ReportSchema = new Schema(
  {
    reporter: { name: String, email: String },
    reason: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PostSchema = new Schema(
  {
    author: { name: String, email: String },
    content: String,
    attachments: [AttachmentSchema],
    isAnnouncement: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GroupSchema = new Schema(
  {
    name: { type: String, required: true },
    topic: { type: String, default: "general" },
    description: String,
    location: String,
    owner: { name: String, email: String },
    members: [MemberSchema],
    posts: [PostSchema],
    reports: [ReportSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Group || mongoose.model("Group", GroupSchema);
