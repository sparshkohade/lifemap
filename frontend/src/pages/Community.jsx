// src/pages/Community.jsx
import React from "react";

export default function Community() {
  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6 text-blue-600 dark:text-blue-400">
        Community
      </h1>
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          Welcome to the LifeMap community! 🌍
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          Here, you can share your goals, connect with others, and track progress together.
        </p>
      </div>
    </div>
  );
}
