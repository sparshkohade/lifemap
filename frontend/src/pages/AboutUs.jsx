import React from "react";
import { motion } from "framer-motion";

const AboutUs = () => {
  return (
    <motion.div
      className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-6 py-16"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
        About LifeMap
      </h1>
      <p className="max-w-3xl text-lg md:text-xl text-gray-300 text-center leading-relaxed">
        LifeMap is your personal roadmap builder — a platform designed to help
        you visualize, plan, and achieve your career goals with clarity.  
        Our mission is to make goal-setting intuitive, guided, and visually engaging.  
        Whether you're a student, professional, or lifelong learner, LifeMap helps you
        track your growth, discover opportunities, and stay motivated along the way.
      </p>

      <div className="mt-12 grid md:grid-cols-3 gap-8 max-w-5xl">
        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold mb-3">🎯 Our Vision</h3>
          <p className="text-gray-400">
            To empower individuals with personalized digital roadmaps for every goal they pursue.
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold mb-3">🤝 Our Mission</h3>
          <p className="text-gray-400">
            To simplify complex life goals into clear, actionable steps through technology and design.
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold mb-3">🚀 The Team</h3>
          <p className="text-gray-400">
            LifeMap is built by passionate learners and creators led by <strong>Sparsh Kohade</strong>,
            aiming to make goal visualization smarter and more human.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AboutUs;
