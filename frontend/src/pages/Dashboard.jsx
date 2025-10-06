// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import RoadmapCard from "../components/RoadmapCard";
import { Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom"; // for navigation

const dummyRoadmaps = [
  { id: 1, title: "Fullstack Developer", desc: "Learn MERN stack", progress: 40, lastUpdated: "2 days ago" },
  { id: 2, title: "AI Researcher", desc: "Deep learning roadmap", progress: 60, lastUpdated: "5 days ago" },
  { id: 3, title: "UI/UX Designer", desc: "Master Figma & UX principles", progress: 30, lastUpdated: "1 day ago" },
];

const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const filteredRoadmaps = dummyRoadmaps.filter((roadmap) =>
    roadmap.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 transition-colors duration-300">
      
      {/* Header: Title + Dark Mode Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Roadmaps</h1>
        
        {/* Dark Mode Toggle + Create Button */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search roadmaps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={() => navigate("/create-roadmap")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            + Create New Roadmap
          </button>
          
        </div>
      </div>

      {/* Roadmap Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoadmaps.map((roadmap) => (
          <RoadmapCard key={roadmap.id} roadmap={roadmap} darkMode={darkMode} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
