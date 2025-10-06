// src/components/Navbar.jsx
import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
import { auth, signOut } from "../firebase";
import { Moon, Sun } from "lucide-react";

export default function Navbar() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      console.log("Not a Firebase user, ignoring...");
    }
    localStorage.removeItem("user");
    navigate("/");
  };

  const linkClasses = (path) =>
    `hover:text-blue-600 dark:hover:text-blue-400 ${
      location.pathname === path
        ? "text-blue-600 font-semibold dark:text-blue-400"
        : "text-gray-700 dark:text-gray-300"
    }`;

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold text-blue-600 dark:text-blue-400"
        >
          LifeMap
        </Link>

        {/* Navigation Links */}
        <nav className="space-x-6 font-medium flex items-center">
          <Link to="/" className={linkClasses("/")}>Home</Link>
          <Link to="/goals" className={linkClasses("/goals")}>Goals</Link>
          <Link to="/roadmap" className={linkClasses("/roadmap")}>Roadmap</Link>
          <Link to="/dashboard" className={linkClasses("/dashboard")}>Dashboard</Link>
          <Link to="/community" className={linkClasses("/community")}>Community</Link>
        </nav>

        {/* Right Controls */}
        <div className="space-x-4 flex items-center">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {theme === "dark" ? (
              <Sun className="text-yellow-400" />
            ) : (
              <Moon className="text-gray-800 dark:text-gray-200" />
            )}
          </button>

          {/* User / Auth Buttons */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-300">
                Hi, {user?.name || "User"}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
