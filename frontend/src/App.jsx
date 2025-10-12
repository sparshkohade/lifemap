// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Community from "./pages/Community";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Roadmap from "./pages/Roadmap.jsx";
import Goals from "./pages/Goals";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile.jsx";
import CareerTest from "./pages/CareerTest.jsx";


export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Router>
        <Navbar />
        <div className="px-6 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/community" element={<Community />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/test/:field" element={<CareerTest />} />

          </Routes>
        </div>
      </Router>
    </div>
  );
}
