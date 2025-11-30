import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";
import { auth, signOut } from "../firebase";
import { Moon, Sun, User, Settings, LogOut, Users } from "lucide-react";

export default function Navbar() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Listen to Firebase Auth changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const formattedUser = {
          name:
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "User",
          email: firebaseUser.email || "",
          photoURL: firebaseUser.photoURL || null,
        };

        localStorage.setItem("user", JSON.stringify(formattedUser));
        setUser(formattedUser);
      } else {
        localStorage.removeItem("user");
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      console.log("Not a Firebase user, ignoring...");
    }
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const linkClasses = (path) =>
    `hover:text-blue-600 dark:hover:text-blue-400 ${
      location.pathname === path
        ? "text-blue-600 font-semibold dark:text-blue-400"
        : "text-gray-700 dark:text-gray-300"
    }`;

  /* ---------------- Avatar Component ---------------- */
  const Avatar = ({ photoURL, name, email, size = 36 }) => {
    if (photoURL) {
      return (
        <img
          src={photoURL}
          alt="User Avatar"
          style={{ width: size, height: size }}
          className="rounded-full border border-gray-300 dark:border-gray-600 object-cover"
        />
      );
    }

    const initial =
      name?.charAt(0)?.toUpperCase() ||
      email?.charAt(0)?.toUpperCase() ||
      "?";

    const gradients = [
      "from-pink-500 to-rose-500",
      "from-blue-500 to-indigo-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-amber-500",
      "from-purple-500 to-violet-500",
    ];
    const randomGradient =
      gradients[
        (name?.charCodeAt(0) || email?.charCodeAt(0) || 65) % gradients.length
      ];

    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-full flex items-center justify-center font-semibold text-white border border-gray-300 dark:border-gray-600 bg-gradient-to-br ${randomGradient}`}
      >
        {initial}
      </div>
    );
  };

  /* ---------------- Mentor Modal ---------------- */
  const MentorModal = () => (
    <AnimatePresence>
      {mentorModalOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/60 z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`w-[90%] max-w-md rounded-2xl p-6 shadow-2xl border ${
              theme === "dark"
                ? "bg-gray-900 border-gray-700 text-gray-100"
                : "bg-white border-gray-300 text-gray-800"
            }`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h2 className="text-xl font-bold mb-4 text-center">
              Connect with a Mentor
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Mentor request submitted successfully!");
                setMentorModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm mb-1">Your Name</label>
                <input
                  type="text"
                  defaultValue={user?.name || ""}
                  className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Goal Area</label>
                <input
                  type="text"
                  placeholder="e.g. Web Development, Design"
                  className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Message</label>
                <textarea
                  rows={3}
                  placeholder="Tell us what kind of mentor guidance you’re seeking..."
                  className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600"
                  required
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setMentorModalOpen(false)}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

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
          <Link to="/" className={linkClasses("/")}>
            Home
          </Link>

          {/* Replaced Goals with Prep */}
          <Link to="/prep" className={linkClasses("/prep")}>
            Prep
          </Link>

          <Link to="/roadmap" className={linkClasses("/roadmap")}>
            Roadmap
          </Link>
          <Link to="/dashboard" className={linkClasses("/dashboard")}>
            Dashboard
          </Link>

          {/* Added About Us link */}
          <Link to="/about" className={linkClasses("/about")}>
            About Us
          </Link>

          <Link to="/community" className={linkClasses("/community")}>
            Community
          </Link>
        </nav>

        {/* Right Controls */}
        <div className="space-x-4 flex items-center relative" ref={dropdownRef}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {theme === "dark" ? (
              <Sun className="text-yellow-400" />
            ) : (
              <Moon className="text-gray-800 dark:text-gray-200" />
            )}
          </button>

          {/* Mentor Button (Only if Logged In) */}
          {user && (
            <button
              onClick={() => setMentorModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition"
            >
              <Users className="w-4 h-4" />
              Connect with Mentor
            </button>
          )}

          {/* User Auth Section */}
          {user ? (
            <>
              {/* Avatar Icon */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="focus:outline-none"
              >
                <Avatar
                  photoURL={user.photoURL}
                  name={user.name}
                  email={user.email}
                />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center gap-3">
                      <Avatar
                        photoURL={user.photoURL}
                        name={user.name}
                        email={user.email}
                        size={40}
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <ul className="py-2 text-sm text-gray-700 dark:text-gray-300">
                      <li>
                        <button
                          onClick={() => {
                            navigate("/profile");
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <User className="w-4 h-4" /> Profile
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            toggleTheme();
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Settings className="w-4 h-4" /> Theme
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
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

      {/* Mentor Modal */}
      <MentorModal />
    </header>
  );
}
