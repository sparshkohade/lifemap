// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [roadmaps, setRoadmaps] = useState(null); // null = not loaded yet
  const [error, setError] = useState("");
  const [deletingIds, setDeletingIds] = useState([]);
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();
  const BACKEND = import.meta.env.VITE_BACKEND || "http://localhost:5000";

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const userRaw = localStorage.getItem("user");
        let userId = null;
        try {
          const parsed = userRaw ? JSON.parse(userRaw) : null;
          userId = parsed?.user?._id || parsed?._id || localStorage.getItem("userId");
        } catch (e) {
          userId = localStorage.getItem("userId");
        }

        let res;
        if (token && userId) {
          res = await axios.get(`${BACKEND}/api/roadmaps/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
            validateStatus: (s) => s >= 200 && s < 500,
          });
        } else {
          res = await axios.get(`${BACKEND}/api/roadmaps/latest`, {
            validateStatus: (s) => s >= 200 && s < 500,
          });
        }

        // treat 404 / 204 as empty
        if (!res || res.status === 404 || res.status === 204) {
          if (isMounted) setRoadmaps([]);
          return;
        }

        const body = res.data;
        let normalized = [];

        if (!body) normalized = [];
        else if (Array.isArray(body)) normalized = body;
        else if (Array.isArray(body.roadmaps)) normalized = body.roadmaps;
        else if (body.roadmap) normalized = Array.isArray(body.roadmap) ? body.roadmap : [body.roadmap];
        else if (body._id || body.id || body.title || body.goal) normalized = [body];
        else if (Array.isArray(body.data)) normalized = body.data;
        else if (Array.isArray(body.result)) normalized = body.result;
        else normalized = [];

        normalized = normalized.filter(Boolean);

        if (isMounted) setRoadmaps(normalized);
      } catch (err) {
        console.error("Failed to fetch roadmaps", err);
        const serverMessage =
          err?.response?.data?.message || err?.response?.data || err?.message || "Could not fetch roadmaps";
        if (isMounted) setError(serverMessage);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Redirect to the frontend Roadmap page (Roadmap.jsx) to create a new roadmap
  // This navigates to /roadmap — ensure your routes include <Route path="/roadmap" element={<Roadmap/>} />
  const goToCreatePage = () => {
    setCreating(true);
    navigate("/roadmap");
    // navigation will unmount this component, so we don't need to setCreating(false)
  };

  // Delete handler (optimistic)
  const deleteRoadmap = async (roadmapId) => {
    if (!roadmapId) {
      alert("Cannot delete: missing roadmap id.");
      return;
    }

    const ok = window.confirm("Are you sure you want to permanently delete this roadmap?");
    if (!ok) return;

    const token = localStorage.getItem("token");
    const previous = roadmaps;
    setRoadmaps((prev) =>
      prev ? prev.filter((r) => (r._id || r.id || r.roadmap?._id || r.roadmap?.id) !== roadmapId) : []
    );
    setDeletingIds((s) => [...s, roadmapId]);

    try {
      await axios.delete(`${BACKEND}/api/roadmaps/${roadmapId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
        validateStatus: (s) => s >= 200 && s < 500,
      });
    } catch (err) {
      console.error("Failed to delete roadmap", err);
      // rollback
      setRoadmaps(previous);
      const msg = err?.response?.data?.message || err?.message || "Failed to delete roadmap";
      alert(`Delete failed: ${msg}`);
    } finally {
      setDeletingIds((s) => s.filter((id) => id !== roadmapId));
    }
  };

  if (loading) return <div className="p-6">Loading your roadmaps...</div>;

  if (error)
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-2">Dashboard</h2>
        <p className="text-red-600 mb-4">Error: {String(error)}</p>
        <div className="flex gap-2">
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded bg-blue-600 text-white">
            Retry
          </button>
          <button onClick={goToCreatePage} className="px-4 py-2 rounded border">
            Create roadmap
          </button>
        </div>
      </div>
    );

  if (!roadmaps || roadmaps.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-2">Welcome to LifeMap</h2>
        <p className="mb-4">You don't have any saved roadmaps yet.</p>

        <div className="mb-4 flex items-center gap-3">
          <button onClick={goToCreatePage} disabled={creating} className="px-4 py-2 rounded bg-green-600 text-white">
            {creating ? "Opening..." : "Create your first roadmap"}
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <p>Tips:</p>
          <ul className="list-disc ml-5">
            <li>Start with a short-term goal (1–3 months).</li>
            <li>Use templates to save time.</li>
            <li>Export or share your roadmap once created.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Your Roadmaps</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {roadmaps.map((r, idx) => {
          const id = r._id || r.id || r.roadmap?._id || r.roadmap?.id || null;
          const title = r.title || r.goal || r.roadmap?.title || `Untitled Roadmap ${idx + 1}`;
          const meta = r.meta || r.roadmap?.meta || {};
          const key = id || `${title}-${idx}`;
          const isDeleting = id ? deletingIds.includes(id) : false;

          return (
            <div key={key} className="p-4 border rounded-lg bg-white dark:bg-gray-800">
              <h3 className="font-semibold text-lg">{title}</h3>
              {meta.level && <div className="text-sm text-gray-500">Level: {meta.level}</div>}
              <div className="mt-2 flex gap-2">
                {id ? (
                  <Link to={`/dashboard/roadmaps/${id}`} className="px-3 py-1 border rounded">
                    Open
                  </Link>
                ) : (
                  <button className="px-3 py-1 border rounded opacity-60 cursor-not-allowed">No ID</button>
                )}

                <button
                  onClick={() => deleteRoadmap(id)}
                  disabled={!id || isDeleting}
                  className={`px-3 py-1 border rounded ${isDeleting ? "opacity-60 cursor-not-allowed" : "bg-red-50 hover:bg-red-100"}`}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
