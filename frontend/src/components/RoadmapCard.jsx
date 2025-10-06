import React from "react";

const RoadmapCard = ({ roadmap, darkMode }) => {
  return (
    <div
      className={`p-4 rounded-lg shadow hover:shadow-lg transition ${
        darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
      }`}
    >
      <h2 className="text-xl font-semibold mb-2">{roadmap.title}</h2>
      <p className="mb-4">{roadmap.desc}</p>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
        <div
          className="bg-blue-500 h-3 rounded-full"
          style={{ width: `${roadmap.progress}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        Last Updated: {roadmap.lastUpdated}
      </p>
      <div className="flex gap-2">
        <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition">
          Open
        </button>
        <button className="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition">
          Edit
        </button>
      </div>
    </div>
  );
};

export default RoadmapCard;
