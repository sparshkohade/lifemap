import React from "react";

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-md p-6 hidden md:block">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">LifeMap</h2>
      <nav className="flex flex-col gap-3">
        <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400">Home</a>
        <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400">My Roadmaps</a>
        <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400">Create New Roadmap</a>
        <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400">Community</a>
        <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400">Settings</a>
      </nav>
    </aside>
  );
};

export default Sidebar;
