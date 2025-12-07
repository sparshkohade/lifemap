// frontend/src/pages/GroupDetail.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Users, Send, Megaphone, X, ChevronLeft, ChevronRight, DownloadCloud, Paperclip } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // Composer state
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Image preview modal state
  const [previewImages, setPreviewImages] = useState([]); // array of urls
  const [previewIndex, setPreviewIndex] = useState(0);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();

  const fetchGroup = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/groups/${id}`);
      if (!res.ok) throw new Error("Failed to load group");
      const data = await res.json();
      setGroup(data);
    } catch (err) {
      console.error(err);
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  const isMember = !!group?.members?.find((m) => m.email === user?.email);
  const isOwner = user && group?.owner?.email === user.email; // owner == admin

  // file selection (small preview support)
  useEffect(() => {
    return () => {
      files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const onFilesChange = (e) => {
    const list = Array.from(e.target.files).slice(0, 4);
    const withPreviews = list.map((f) => (f.type.startsWith("image") ? Object.assign(f, { preview: URL.createObjectURL(f) }) : f));
    files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    setFiles(withPreviews);
  };

  const clearComposer = () => {
    setText("");
    files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  // submit post (multipart)
  const submitPost = async ({ asAnnouncement = false } = {}) => {
    if (!user) { alert("Please login to post."); navigate("/login"); return; }
    if (!text.trim() && files.length === 0) { alert("Add text or attach a file."); return; }

    if (asAnnouncement && !isOwner) { alert("Only the group owner can make announcements."); return; }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("author", JSON.stringify({ name: user.name, email: user.email }));
      form.append("content", text.trim());
      files.forEach((f) => form.append("files", f));
      if (asAnnouncement) form.append("isAnnouncement", "true");

      const res = await fetch(`${API_BASE}/api/groups/${id}/posts`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to post");
      }

      clearComposer();
      await fetchGroup();
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not post.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open image preview modal for a post's images (images is array of attachment objects)
  const openPreview = (images, startIndex = 0) => {
    const urls = images.map(a => `${API_BASE}${a.url}`);
    setPreviewImages(urls.map(u => encodeURI(u)));
    setPreviewIndex(startIndex);
  };

  const closePreview = () => {
    setPreviewImages([]);
    setPreviewIndex(0);
  };

  // keyboard navigation for modal
  useEffect(() => {
    const handler = (e) => {
      if (!previewImages.length) return;
      if (e.key === "Escape") closePreview();
      if (e.key === "ArrowLeft") setPreviewIndex((i) => (i > 0 ? i - 1 : i));
      if (e.key === "ArrowRight") setPreviewIndex((i) => (i < previewImages.length - 1 ? i + 1 : i));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [previewImages]);

  if (loading) return <div className="min-h-screen flex items-center justify-center p-8"><div className="text-gray-500">Loading...</div></div>;
  if (!group) return <div className="min-h-screen flex items-center justify-center p-8"><div className="text-center"><h2 className="text-xl font-semibold">Group not found</h2></div></div>;

  // Separate announcement posts for top display
  const announcements = (group.posts || []).filter(p => p.isAnnouncement);
  const regularPosts = (group.posts || []).filter(p => !p.isAnnouncement);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-32">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{group.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{group.topic || "general"}</p>

              {/* View group info link */}
              <div className="mt-3">
                <Link
                  to={`/community/${id}/info`}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  View group info
                </Link>
              </div>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              Owner: {group.owner?.name || "—"}
            </div>
          </div>
        </div>


        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 p-4">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Announcements</h3>
            <div className="space-y-3">
              {announcements.slice().reverse().map((p, i) => {
                const images = (p.attachments || []).filter(a => a.type === "image");
                return (
                  <div key={i} className="p-3 rounded-md bg-white dark:bg-gray-800 border shadow-sm">
                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {p.author?.name || "Owner"} • {new Date(p.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-1 text-gray-800 dark:text-gray-100">{p.content}</div>

                    {p.attachments?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {p.attachments.map((a, idx) => {
                          if (a.type === "image") {
                            const url = encodeURI(`${API_BASE}${a.url}`);
                            // find index within this post images
                            const imgIndex = images.findIndex(x => `${API_BASE}${x.url}` === `${API_BASE}${a.url}`);
                            return (
                              <img
                                key={idx}
                                src={url}
                                alt={a.name}
                                className="w-28 h-20 object-cover rounded cursor-pointer shadow hover:opacity-90 transition"
                                onClick={() => openPreview(images, imgIndex >= 0 ? imgIndex : 0)}
                              />
                            );
                          }
                          if (a.type === "link") {
                            return <a key={idx} href={a.url} target="_blank" rel="noreferrer" className="underline">{a.name}</a>;
                          }
                          return (
                            <a key={idx} href={`${API_BASE}${a.url}`} target="_blank" rel="noreferrer" className="px-3 py-1 border rounded inline-flex items-center gap-2">
                              <Paperclip className="w-4 h-4" /> {a.name}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Regular posts */}
        <div className="space-y-4">
          {regularPosts.slice().reverse().map((p, i) => {
            const images = (p.attachments || []).filter(a => a.type === "image");
            return (
              <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-white dark:bg-gray-900 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">{p.author?.name || p.author?.email || "Member"}</span>
                    <span className="mx-2 text-xs">•</span>
                    <span className="text-xs">{new Date(p.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-2 text-gray-800 dark:text-gray-200">{p.content}</div>

                {p.attachments?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {p.attachments.map((a, idx) => {
                      if (a.type === "image") {
                        const url = encodeURI(`${API_BASE}${a.url}`);
                        const imgIndex = images.findIndex(x => `${API_BASE}${x.url}` === `${API_BASE}${a.url}`);
                        return (
                          <img
                            key={idx}
                            src={url}
                            alt={a.name}
                            className="w-40 h-28 object-cover rounded-md cursor-pointer shadow hover:scale-105 transition-transform"
                            onClick={() => openPreview(images, imgIndex >= 0 ? imgIndex : 0)}
                          />
                        );
                      }
                      if (a.type === "link") {
                        return <a key={idx} href={a.url} target="_blank" rel="noreferrer" className="px-3 py-1 underline rounded-md">{a.name}</a>;
                      }
                      return (
                        <a key={idx} href={`${API_BASE}${a.url}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-1 border rounded-md">
                          <Paperclip className="w-4 h-4" /> {a.name}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {regularPosts.length === 0 && <div className="text-sm text-gray-500">No posts yet.</div>}
        </div>
      </div>

      {/* Composer (pinned) */}
      <div className="fixed left-0 right-0 bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-900/80 rounded-full px-4 py-2 flex items-center gap-3 shadow-sm">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isMember ? "Write a message..." : "Join the group to participate"}
              disabled={!isMember}
              className="flex-1 bg-transparent outline-none placeholder-gray-400 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitPost({ asAnnouncement: false });
                }
              }}
            />
            <input ref={fileInputRef} id="composer-files" type="file" accept="image/*,application/pdf" multiple onChange={onFilesChange} className="hidden" />
            <label htmlFor="composer-files" className={`px-3 py-1 rounded-full border cursor-pointer ${!isMember ? "opacity-50 pointer-events-none" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
              📎
            </label>
          </div>

          <button
            onClick={() => submitPost({ asAnnouncement: false })}
            disabled={!isMember || submitting}
            className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>

          {isOwner && (
            <button
              onClick={() => {
                if (!confirm("Post this message as an announcement? It will be highlighted for all members.")) return;
                submitPost({ asAnnouncement: true });
              }}
              disabled={submitting}
              className="ml-2 px-4 py-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 flex items-center gap-2 shadow"
              title="Make announcement (owner only)"
            >
              <Megaphone className="w-4 h-4" /> Announcement
            </button>
          )}
        </div>

        {/* Selected file previews */}
        {files.length > 0 && (
          <div className="max-w-4xl mx-auto mt-2 px-1">
            <div className="flex gap-2 overflow-auto">
              {files.map((f, idx) => (
                <div key={idx} className="relative w-20 h-16 rounded overflow-hidden border bg-white dark:bg-gray-800">
                  {f.preview ? <img src={f.preview} alt={f.name} className="w-full h-full object-cover" /> : <div className="p-2 text-xs">{f.name}</div>}
                  <button onClick={() => {
                    if (f.preview) URL.revokeObjectURL(f.preview);
                    const next = files.slice(); next.splice(idx, 1); setFiles(next);
                  }} className="absolute -top-2 -right-2 bg-white dark:bg-gray-900 rounded-full px-1 text-xs border">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImages.length > 0 && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="relative max-w-5xl w-[92%] max-h-[92%]" initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}>
              <img
                src={previewImages[previewIndex]}
                alt={`Preview ${previewIndex + 1}`}
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl bg-black"
              />

              {/* Controls */}
              <button onClick={closePreview} className="absolute top-3 right-3 bg-white/90 rounded-full p-2 hover:bg-white">
                <X className="w-5 h-5 text-gray-800" />
              </button>

              {previewIndex > 0 && (
                <button
                  onClick={() => setPreviewIndex(previewIndex - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-800" />
                </button>
              )}

              {previewIndex < previewImages.length - 1 && (
                <button
                  onClick={() => setPreviewIndex(previewIndex + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
                >
                  <ChevronRight className="w-5 h-5 text-gray-800" />
                </button>
              )}

              <a
                href={previewImages[previewIndex]}
                download
                className="absolute bottom-4 right-4 inline-flex items-center gap-2 bg-white/90 px-3 py-2 rounded-full hover:bg-white"
              >
                <DownloadCloud className="w-4 h-4" /> Download
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
