// src/pages/Dashboard.jsx
import React from "react";

export default function Dashboard() {
  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6 text-blue-600 dark:text-blue-400">
        Dashboard
      </h1>
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
        <p className="text-gray-700 dark:text-gray-300">
          Welcome to your personal dashboard. View progress, goals, and milestones here!
        </p>
      </div>
    </div>
  );
}
