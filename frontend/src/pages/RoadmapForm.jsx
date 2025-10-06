// frontend/src/pages/Roadmap.jsx
import React, { useState } from "react";
import { Plus, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const initialSteps = [
  { id: 1, title: "Learn HTML & CSS", status: "completed" },
  { id: 2, title: "Learn JavaScript", status: "in-progress" },
  { id: 3, title: "Learn React", status: "not-started" },
];

const Roadmap = () => {
  const [steps, setSteps] = useState(initialSteps);
  const [newStepTitle, setNewStepTitle] = useState("");

  const addStep = () => {
    if (newStepTitle.trim() === "") return;
    setSteps([...steps, { id: steps.length + 1, title: newStepTitle, status: "not-started" }]);
    setNewStepTitle("");
  };

  const toggleStepStatus = (id) => {
    setSteps(
      steps.map((step) =>
        step.id === id
          ? {
              ...step,
              status:
                step.status === "not-started"
                  ? "in-progress"
                  : step.status === "in-progress"
                  ? "completed"
                  : "not-started",
            }
          : step
      )
    );
  };

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 transition-colors duration-300">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">Roadmap: Become a Web Developer</h1>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-4 rounded-full mb-6">
        <div
          className="bg-blue-500 h-4 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Steps Timeline */}
      <div className="flex flex-col gap-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg shadow flex justify-between items-center transition-colors ${
              step.status === "completed"
                ? "bg-green-100 dark:bg-green-800"
                : step.status === "in-progress"
                ? "bg-yellow-100 dark:bg-yellow-800"
                : "bg-white dark:bg-gray-800"
            }`}
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Status: {step.status}</p>
            </div>
            <button onClick={() => toggleStepStatus(step.id)} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              <CheckCircle className={`text-green-500 ${step.status === "completed" ? "animate-bounce" : ""}`} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Add New Step */}
      <div className="flex gap-2 mt-6">
        <input
          type="text"
          placeholder="Add new step..."
          value={newStepTitle}
          onChange={(e) => setNewStepTitle(e.target.value)}
          className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={addStep}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition flex items-center gap-1"
        >
          <Plus size={16} /> Add Step
        </button>
      </div>
    </div>
  );
};

export default Roadmap;
