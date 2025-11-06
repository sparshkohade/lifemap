// frontend/src/pages/GroupInfo.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Users, Trash2, Flag, ArrowLeft, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function GroupInfo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // preview modal state
  const [previewImages, setPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [actioning, setActioning] = useState(false);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();

  const isOwner = user && group?.owner?.email === user.email;
  const isMember = !!group?.members?.find(m => m.email === user?.email);

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

  // Members avatars (initials)
  const Avatar = ({ name, size = 40 }) => {
    const initial = name?.charAt(0)?.toUpperCase() || "?";
    const colors = ["from-blue-500 to-indigo-500","from-green-400 to-emerald-500","from-pink-500 to-rose-500","from-orange-400 to-amber-500"];
    const color = colors[(name?.charCodeAt(0) || 65) % colors.length];
    return (
      <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br ${color}`}>
        {initial}
      </div>
    );
  };

  // extract media (images) from posts
  const mediaAttachments = (group?.posts || [])
    .flatMap(p => p.attachments?.filter(a => a.type === "image") || [])
    .map(a => `${API_BASE}${a.url}`);

  const openPreview = (startIndex = 0) => {
    setPreviewImages(mediaAttachments.map(u => encodeURI(u)));
    setPreviewIndex(startIndex);
  };

  // Leave group
  const handleLeave = async () => {
    if (!user) return navigate("/login");
    if (!confirm("Are you sure you want to leave this group?")) return;
    setActioning(true);
    try {
      const res = await fetch(`${API_BASE}/api/groups/${id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      if (!res.ok) throw new Error("Failed to leave group");
      await fetchGroup();
      navigate("/community");
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not leave group");
    } finally {
      setActioning(false);
    }
  };

  // Delete group (owner)
  const handleDelete = async () => {
    if (!user) return navigate("/login");
    if (!isOwner) return alert("Only the owner can delete this group.");
    if (!confirm("Delete this group permanently? This cannot be undone.")) return;
    setActioning(true);
    try {
      const res = await fetch(`${API_BASE}/api/groups/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: JSON.stringify({ email: user.email, name: user.name }) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to delete");
      }
      navigate("/community");
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not delete group");
    } finally {
      setActioning(false);
    }
  };

  // Report
  const submitReport = async () => {
    if (!user) return navigate("/login");
    if (!reportReason.trim()) return alert("Please add a reason");
    setSubmittingReport(true);
    try {
      const res = await fetch(`${API_BASE}/api/groups/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reporter: { name: user.name, email: user.email }, reason: reportReason.trim() }),
      });
      if (!res.ok) throw new Error("Failed to submit report");
      setShowReportModal(false);
      setReportReason("");
      alert("Report submitted. Thank you.");
    } catch (err) {
      console.error(err);
      alert(err.message || "Report failed");
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!group) return <div className="p-8 text-center">Group not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/community" className="inline-flex items-center gap-2 text-sm text-blue-600"><ArrowLeft className="w-4 h-4" /> Back</Link>
          <h1 className="text-2xl font-semibold">{group.name}</h1>
          <span className="ml-3 inline-flex items-center gap-1 text-xs text-gray-500"><Users className="w-4 h-4" /> {group.members?.length || 0}</span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left column: General info + actions */}
          <div className="md:col-span-1 bg-white dark:bg-gray-900 rounded-lg p-4 border shadow-sm">
            <h3 className="text-lg font-semibold">About</h3>
            <p className="text-sm text-gray-600 mt-2">{group.description || "No description provided."}</p>

            <div className="mt-4">
              <div className="text-xs text-gray-500">Topic</div>
              <div className="text-sm font-medium">{group.topic || "general"}</div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-gray-500">Owner</div>
              <div className="text-sm font-medium">{group.owner?.name || group.owner?.email || "—"}</div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={handleLeave}
                disabled={!isMember || actioning}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Leave Group
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Report Group
              </button>

              {isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={actioning}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 inline-block mr-2" /> Delete Group
                </button>
              )}
            </div>
          </div>

          {/* Middle: Members */}
          <div className="md:col-span-1 bg-white dark:bg-gray-900 rounded-lg p-4 border shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Members</h3>
              <span className="text-sm text-gray-500">{group.members?.length || 0}</span>
            </div>

            <div className="mt-3 space-y-2 max-h-64 overflow-auto pr-2">
              {group.members?.map((m, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center font-semibold text-gray-700 dark:text-gray-200">
                    {m.name?.charAt(0)?.toUpperCase() || m.email?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{m.name || m.email}</div>
                    <div className="text-xs text-gray-500">{m.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Media */}
          <div className="md:col-span-1 bg-white dark:bg-gray-900 rounded-lg p-4 border shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Media</h3>
              <div className="text-xs text-gray-500">{mediaAttachments.length} items</div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {mediaAttachments.length === 0 && <div className="text-sm text-gray-500 col-span-full">No media yet.</div>}
              {mediaAttachments.map((u, i) => (
                <img
                  key={i}
                  src={encodeURI(u)}
                  alt={`media-${i}`}
                  className="w-full h-24 object-cover rounded cursor-pointer"
                  onClick={() => { setPreviewImages(mediaAttachments.map(x => encodeURI(x))); setPreviewIndex(i); }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-[90%] max-w-lg bg-white dark:bg-gray-900 rounded-lg p-5 shadow-lg" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }}>
              <h3 className="text-lg font-semibold">Report Group</h3>
              <p className="text-sm text-gray-500 mt-1">Tell us why you’re reporting this group (abuse, spam, etc.)</p>

              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                className="w-full mt-3 rounded border px-3 py-2 bg-white dark:bg-gray-800"
                placeholder="Reason for reporting..."
              />

              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => setShowReportModal(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button onClick={submitReport} disabled={submittingReport} className="px-4 py-2 rounded bg-blue-600 text-white">{submittingReport ? "Sending..." : "Send Report"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Preview Modal */}
      <AnimatePresence>
        {previewImages.length > 0 && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="relative w-[92%] max-w-5xl max-h-[92%]" initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}>
              <img src={previewImages[previewIndex]} alt="preview" className="w-full h-auto max-h-[90vh] object-contain rounded" />
              <button onClick={() => { setPreviewImages([]); setPreviewIndex(0); }} className="absolute top-3 right-3 bg-white rounded-full p-2">✕</button>
              {previewIndex > 0 && <button onClick={() => setPreviewIndex(previewIndex - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-2">‹</button>}
              {previewIndex < previewImages.length - 1 && <button onClick={() => setPreviewIndex(previewIndex + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-2">›</button>}
              <a href={previewImages[previewIndex]} download className="absolute bottom-4 right-4 bg-white px-3 py-2 rounded">Download</a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
