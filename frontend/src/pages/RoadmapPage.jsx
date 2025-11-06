// src/pages/RoadmapPage.jsx
import React from "react";
import RoadmapGenerator from "../components/RoadmapGenerator";
import { useAuth } from "../context/AuthContext"; // assuming you have auth context

export default function RoadmapPage() {
  const { user } = useAuth(); // get logged-in user info

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <RoadmapGenerator user={user} />
    </div>
  );
}
