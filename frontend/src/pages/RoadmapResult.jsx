// frontend/src/pages/RoadmapResult.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function RoadmapResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const roadmap = location.state?.roadmap;

  console.log("Roadmap data:", roadmap);

  if (!roadmap || !roadmap.steps || roadmap.steps.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-2xl font-bold text-gray-800">No roadmap data found ❌</h2>
        <button
          onClick={() => navigate("/roadmap")}
          className="mt-4 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Generate Roadmap
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-8 lg:px-16">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-10">
        {roadmap.domain} Roadmap ({roadmap.level})
      </h1>

      <div className="relative border-l-4 border-blue-500 ml-6">
        {roadmap.steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
            className="mb-10 ml-6 relative"
          >
            {/* Milestone dot */}
            <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full text-white text-sm">
              {index + 1}
            </span>

            {/* Step card */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <h3 className="text-xl font-semibold text-blue-600">{step.title}</h3>
              <p className="text-gray-700 mt-2">{step.description}</p>
              {step.duration && (
                <p className="text-gray-500 mt-1 font-medium">Duration: {step.duration}</p>
              )}
              {step.resources && step.resources.length > 0 && (
                <ul className="list-disc pl-5 mt-2 text-gray-700 space-y-1">
                  {step.resources.map((res, i) => (
                    <li key={i}>
                      <a
                        href={res.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {res.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-12">
        <button
          onClick={() => navigate("/roadmap")}
          className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
        >
          Generate Another Roadmap
        </button>
      </div>
    </div>
  );
}
import React from "react";