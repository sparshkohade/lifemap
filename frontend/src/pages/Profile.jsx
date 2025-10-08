import React from "react";
import { User, Map, CheckCircle2, TrendingUp, Edit3 } from "lucide-react";

export default function Profile() {
  // Temporary demo data (replace later with user data from backend)
  const user = {
    name: "Sparsh Kohade",
    email: "sparsh@example.com",
    bio: "Aspiring developer and creator of LifeMap 🚀",
    totalRoadmaps: 5,
    completedGoals: 12,
    progress: 68,
    recentRoadmaps: [
      { title: "Frontend Developer Path", progress: 90 },
      { title: "UI/UX Designer Journey", progress: 70 },
      { title: "Data Analyst Roadmap", progress: 40 },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 text-gray-900 dark:text-gray-100">
      {/* Profile Header */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl font-bold text-white shadow-lg">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-2">{user.email}</p>
          <p className="italic mb-4">{user.bio}</p>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all">
            <Edit3 size={18} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow flex items-center gap-4">
          <Map className="text-indigo-500" size={32} />
          <div>
            <p className="text-lg font-semibold">{user.totalRoadmaps}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Roadmaps</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow flex items-center gap-4">
          <CheckCircle2 className="text-green-500" size={32} />
          <div>
            <p className="text-lg font-semibold">{user.completedGoals}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Completed Goals</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow flex items-center gap-4">
          <TrendingUp className="text-purple-500" size={32} />
          <div>
            <p className="text-lg font-semibold">{user.progress}%</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Overall Progress</p>
          </div>
        </div>
      </div>

      {/* Recent Roadmaps */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 mt-10 rounded-2xl shadow">
        <h2 className="text-2xl font-semibold mb-6">Recent Roadmaps</h2>
        <div className="space-y-4">
          {user.recentRoadmaps.map((r, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-xl"
            >
              <span>{r.title}</span>
              <span className="text-sm text-gray-400">{r.progress}% complete</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
