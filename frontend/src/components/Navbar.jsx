import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, signOut, provider, signInWithPopup } from "../firebase";
import axios from "axios";
import { FcGoogle } from "react-icons/fc";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ to highlight active page
  const user = JSON.parse(localStorage.getItem("user"));

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth); // if Google user
    } catch (err) {
      console.log("Not a Firebase user, ignoring...");
    }
    localStorage.removeItem("user");
    navigate("/");
  };

  // Google login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();

      const { data } = await axios.post("http://localhost:5000/api/auth/google", { token });

      localStorage.setItem("user", JSON.stringify(data));
      navigate("/goals");
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  // Helper to highlight active link
  const linkClasses = (path) =>
    `hover:text-blue-600 ${
      location.pathname === path ? "text-blue-600 font-semibold" : "text-gray-700"
    }`;

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-blue-600">
          LifeMap
        </Link>

        {/* Nav Links */}
        <nav className="space-x-6 font-medium">
          <Link to="/" className={linkClasses("/")}>Home</Link>
          <Link to="/goals" className={linkClasses("/goals")}>Goals</Link>
          <Link to="/roadmap" className={linkClasses("/roadmap")}>Roadmap</Link>
          <Link to="/dashboard" className={linkClasses("/dashboard")}>Dashboard</Link>
        </nav>

        {/* Auth Buttons */}
        <div className="space-x-4 flex items-center">
          {user ? (
            <>
              <span className="text-gray-600">Hi, {user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Sign Up
              </Link>
              <button
                onClick={handleGoogleLogin}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
              >
                <FcGoogle size={22} />
                <span className="font-medium">Sign in</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
