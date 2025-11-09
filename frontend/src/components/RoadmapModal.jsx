// src/components/RoadmapModal.jsx
import React from "react";

export default function RoadmapModal({ node, onClose }) {
  if (!node) return null;
  // node comes from flowJson.nodes item (raw)
  const { title, subtitle, description, tags = [], estimatedTime, startDate, endDate } = node;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">{title}</h3>
            {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
            <div className="mt-4 text-gray-700 dark:text-gray-200">{description}</div>

            {tags.length > 0 && <div className="flex gap-2 mt-4">{tags.map(t => <span key={t} className="text-xs px-2 py-1 bg-gray-100 rounded">{t}</span>)}</div>}

            <div className="mt-3 text-sm text-gray-500">
              {estimatedTime && <div>Estimated: {estimatedTime}</div>}
              {startDate && endDate && <div>Dates: {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}</div>}
            </div>
          </div>

          <div>
            <button onClick={onClose} className="px-3 py-2 rounded bg-gray-100">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
