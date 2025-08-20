import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-6">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Welcome to <span className="text-blue-600">LifeMap</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-6">
          Your personal roadmap to success. Set SMART goals, track milestones,
          and stay motivated with analytics & gamification.
        </p>
        <Link
          to="/goals"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          Get Started
        </Link>
      </section>

      {/* Features Section */}
      <section className="py-16 px-8 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="bg-gray-100 p-6 rounded-xl shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">🎯 Goal Structuring</h2>
          <p className="text-gray-600">
            Break down your ambitions into SMART goals and organize them for clarity.
          </p>
        </div>
        <div className="bg-gray-100 p-6 rounded-xl shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">📈 Progress Tracking</h2>
          <p className="text-gray-600">
            Track your progress in real-time with dashboards, charts, and analytics.
          </p>
        </div>
        <div className="bg-gray-100 p-6 rounded-xl shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">🏆 Gamification</h2>
          <p className="text-gray-600">
            Stay motivated with streaks, badges, and rewards as you complete milestones.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 border-t border-gray-300">
        © {new Date().getFullYear()} LifeMap. All rights reserved.
      </footer>
    </div>
  );
}
