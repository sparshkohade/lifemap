import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8 text-gray-700">
        
        {/* Brand */}
        <div>
          <h2 className="text-2xl font-bold text-blue-600">LifeMap</h2>
          <p className="text-gray-500 mt-2">
            Your personal career roadmap builder. Stay motivated and achieve your goals!
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-blue-600">Home</Link></li>
            <li><Link to="/goals" className="hover:text-blue-600">Goals</Link></li>
            <li><Link to="/roadmap" className="hover:text-blue-600">Roadmap</Link></li>
            <li><Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-semibold mb-3">Contact</h3>
          <p>Email: <a href="mailto:support@lifemap.com" className="hover:text-blue-600">support@lifemap.com</a></p>
          <p>Phone: +91 98765 43210</p>
          <p className="mt-2">Follow us:</p>
          <div className="flex space-x-4 mt-2">
            <a href="#" className="hover:text-blue-600">🌐</a>
            <a href="#" className="hover:text-blue-600">🐦</a>
            <a href="#" className="hover:text-blue-600">📘</a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="text-center py-4 border-t border-gray-300 text-gray-500 text-sm">
        © {new Date().getFullYear()} LifeMap. All rights reserved.
      </div>
    </footer>
  );
}
