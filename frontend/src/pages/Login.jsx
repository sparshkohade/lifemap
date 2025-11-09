import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FcGoogle } from "react-icons/fc";
import { auth, provider, signInWithPopup } from "../firebase";
import API from "../utils/api";
import { ThemeContext } from "../context/ThemeContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  // ✅ Helper to store user + token
  const saveAuthData = (data) => {
    if (!data) return;
    if (data.token) localStorage.setItem("token", data.token);
    if (data.user?._id || data._id)
      localStorage.setItem("userId", data.user?._id || data._id);
    localStorage.setItem("user", JSON.stringify(data));
  };

  // ✅ Normal email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await API.post("/auth/login", { email, password });
      saveAuthData(data);
      navigate("/goals");
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google login
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      // 1️⃣ Sign in with Firebase popup
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();

      // 2️⃣ Send token to your backend for verification + JWT creation
      const { data } = await axios.post(
        "http://localhost:5000/api/auth/google",
        { token },
        { withCredentials: true } // allow cookie setting
      );

      // 3️⃣ Save backend JWT & user info
      saveAuthData(data);
      navigate("/goals");
    } catch (err) {
      console.error("Google auth failed:", err);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gray-900 text-gray-100"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      <div
        className={`p-8 rounded-xl shadow-lg w-full max-w-md transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">
          Login
        </h2>

        {error && (
          <p className="text-red-500 mb-4 text-center font-medium">{error}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg
                       bg-white dark:bg-gray-700
                       border-gray-300 dark:border-gray-600
                       text-gray-900 dark:text-gray-100
                       placeholder-gray-400 dark:placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg
                       bg-white dark:bg-gray-700
                       border-gray-300 dark:border-gray-600
                       text-gray-900 dark:text-gray-100
                       placeholder-gray-400 dark:placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          <p className="px-3 text-gray-500 text-sm">or</p>
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        {/* ✅ Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                     hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-60"
        >
          <FcGoogle size={22} />
          <span className="font-medium">Continue with Google</span>
        </button>

        <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
