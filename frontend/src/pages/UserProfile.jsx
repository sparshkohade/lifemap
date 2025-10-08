// src/pages/UserProfile.jsx
import React, { useEffect, useState } from "react";
import { auth } from "../firebase";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get Firebase user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchBackendUser(firebaseUser.email);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchBackendUser = async (email) => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/${email}`);
      const data = await res.json();
      setBackendUser(data);
    } catch (error) {
      console.error("Error fetching backend user:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Please log in to view your profile.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-6 transition-colors duration-300">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center space-y-4">
          <img
            src={user.photoURL || "https://i.ibb.co/2FsfXqM/default-avatar.png"}
            alt="Profile"
            className="w-28 h-28 rounded-full border-4 border-blue-500"
          />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {user.displayName || backendUser?.displayName || "User"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
        </div>

        {/* Backend Info */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-4">
            Saved Roadmaps
          </h2>
          {backendUser?.roadmaps && backendUser.roadmaps.length > 0 ? (
            <ul className="space-y-4">
              {backendUser.roadmaps.map((rm, idx) => (
                <li
                  key={idx}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm"
                >
                  <h3 className="font-bold text-gray-800 dark:text-gray-200">
                    {rm.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {rm.description || "No description"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              No saved roadmaps yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
