// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [roadmaps, setRoadmaps] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");

      try {
        // read token and userId that your login saved
        const token = localStorage.getItem("token");
        const userRaw = localStorage.getItem("user");
        let userId = null;
        try {
          const parsed = userRaw ? JSON.parse(userRaw) : null;
          userId = parsed?.user?._id || parsed?._id || localStorage.getItem("userId");
        } catch (e) {
          userId = localStorage.getItem("userId");
        }

        // prefer protected user endpoint if we have token & userId
        if (token && userId) {
          const res = await axios.get(`http://localhost:5000/api/roadmaps/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          setRoadmaps(res.data?.roadmaps || []);
        } else {
          // fallback: public latest demos
          const res = await axios.get("http://localhost:5000/api/roadmaps/latest");
          setRoadmaps(res.data?.roadmap ? [res.data] : res.data?.roadmaps || []);
        }
      } catch (err) {
        console.error("Failed to fetch roadmaps", err);
        setError(err.response?.data?.message || err.message || "Could not fetch roadmaps");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading your roadmaps...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!roadmaps || roadmaps.length === 0) return <div className="p-6">No roadmaps found.</div>;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Your Roadmaps</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {roadmaps.map((r) => {
          const id = r._id || r.id || (r.roadmap && r.roadmap._id) || null;
          const title = r.title || r.goal || (r.roadmap && r.roadmap.title) || "Untitled Roadmap";
          const meta = r.meta || r.roadmap?.meta || {};
          return (
            <div key={id || Math.random()} className="p-4 border rounded-lg bg-white dark:bg-gray-800">
              <h3 className="font-semibold text-lg">{title}</h3>
              {meta.level && <div className="text-sm text-gray-500">Level: {meta.level}</div>}
              <div className="mt-2 flex gap-2">
                {id ? <Link to={`/dashboard/roadmaps/${id}`} className="px-3 py-1 border rounded">Open</Link> :
                  <button className="px-3 py-1 border rounded opacity-60 cursor-not-allowed">No ID</button>}
                <Link to={`/dashboard`} className="px-3 py-1 border rounded">View all</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
