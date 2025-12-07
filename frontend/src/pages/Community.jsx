import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Search, MapPinned, Hash, LogIn, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Community() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/groups`);
      const data = await res.json();
      setGroups(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.filter(g => {
      const matchesQ = !q || g.name.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q);
      const matchesTopic = topic === "all" || g.topic === topic;
      return matchesQ && matchesTopic;
    });
  }, [groups, query, topic]);

  const handleJoinToggle = async (groupId, isMember) => {
    if (!user) return navigate("/login");
    try {
      const res = await fetch(`${API_BASE}/api/groups/${groupId}/${isMember ? "leave" : "join"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, name: user.name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(async () => ({ message: await res.text() }));
        console.error("Join/leave failed:", body);
        throw new Error(body?.error || body?.message || `HTTP ${res.status}`);
      }
      await fetchGroups();
    } catch (e) {
      console.error(e);
      alert("Action failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Community</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Create or join learning groups. Build skills together.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" /> New Group
            </button>
          </div>
        </div>

        {/* Search / Filters */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
              placeholder="Search groups..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
          >
            <option value="all">All topics</option>
            <option value="webdev">Web Development</option>
            <option value="datasci">Data Science</option>
            <option value="design">Design</option>
            <option value="career">Career Prep</option>
          </select>
        </div>

        {/* Groups grid */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
              No groups found. Be the first to create one!
            </div>
          ) : (
            filtered.map(g => {
              const isMember = !!g.members?.find(m => m.email === user?.email);
              return (
                <motion.div
                  key={g._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Link to={`/community/${g._id}`} className="text-xl font-semibold hover:underline">
                        {g.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Hash className="w-4 h-4" /> {g.topic || "general"}
                        <span className="mx-1">•</span>
                        <Users className="w-4 h-4" /> {g.members?.length || 0} members
                      </div>
                    </div>
                    {g.location ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800">
                        <MapPinned className="w-3 h-3" /> {g.location}
                      </span>
                    ) : null}
                  </div>
                  {g.description ? (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{g.description}</p>
                  ) : null}
                  <div className="mt-5 flex items-center justify-between">
                    <Link
                      to={`/community/${g._id}`}
                      className="text-sm underline underline-offset-4 hover:no-underline"
                    >
                      View details
                    </Link>
                    <button
                      onClick={() => handleJoinToggle(g._id, isMember)}
                      className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition ${
                        isMember
                          ? "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          : "border-blue-600 text-white bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {isMember ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                      {isMember ? "Leave" : "Join"}
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Modal */}
      <CreateGroupModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          fetchGroups();
        }}
        user={user}
      />
    </div>
  );
}

function CreateGroupModal({ open, onClose, onCreated, user }) {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("webdev");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  // use top-level API_BASE, don't redeclare (but safe if present)
  const API_BASE_LOCAL = API_BASE;

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    setSubmitting(true);

    try {
      const payload = {
        name: (name || "").trim(),
        topic: (topic || "general").trim(),
        description: (description || "").trim(),
        location: (location || "").trim(),
        owner: { name: user.name, email: user.email }
      };

      if (!payload.name) {
        alert("Please enter a group name.");
        setSubmitting(false);
        return;
      }

      const res = await fetch(`${API_BASE_LOCAL}/api/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // try to parse JSON error body, otherwise fallback to text
        const body = await res.json().catch(async () => ({ message: await res.text() }));
        console.error("Create group failed:", res.status, body);
        alert(body?.error || body?.message || `Create failed (status ${res.status})`);
        setSubmitting(false);
        return;
      }

      const g = await res.json();
      onCreated?.(g);

      // navigate to newly created group's page if server returned id
      if (g && g._id) {
        navigate(`/community/${g._id}`);
      }
    } catch (err) {
      console.error("Could not create group:", err);
      alert(err?.message || "Could not create group.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.form
            onSubmit={submit}
            className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <h3 className="text-xl font-semibold">Create a Group</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Bring learners together around a topic.</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm">Group Name</label>
                <input value={name} onChange={e=>setName(e.target.value)} required
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" />
              </div>
              <div>
                <label className="text-sm">Topic</label>
                <select value={topic} onChange={e=>setTopic(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <option value="webdev">Web Development</option>
                  <option value="datasci">Data Science</option>
                  <option value="design">Design</option>
                  <option value="career">Career Prep</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Description</label>
                <textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" />
              </div>
              <div>
                <label className="text-sm">Location (optional)</label>
                <input value={location} onChange={e=>setLocation(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={onClose}
                className="px-4 py-2 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              <button disabled={submitting} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                {submitting ? "Creating..." : "Create"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
