// backend/utils/gantt.js
// ES module: exports a named function `roadmapToGantt`

/**
 * Convert a roadmap document to a simple Gantt-friendly tasks array.
 * Each task: { id, name, start, end, progress, dependencies }
 */
export function roadmapToGantt(roadmap) {
  if (!roadmap) return [];

  // Compute fallback start (now) if no step has a start
  let globalStart = null;
  (roadmap.steps || []).forEach((s) => {
    if (s.startDate) {
      const d = new Date(s.startDate);
      if (!globalStart || d < globalStart) globalStart = d;
    }
  });
  if (!globalStart) globalStart = new Date();

  const tasks = (roadmap.steps || []).map((s, i) => {
    // choose start / end from step or derive using durationDays
    const start = s.startDate
      ? new Date(s.startDate)
      : new Date(globalStart.getTime() + i * (s.durationDays || 7) * 24 * 3600 * 1000);
    const end = s.endDate
      ? new Date(s.endDate)
      : new Date(start.getTime() + (s.durationDays || 7) * 24 * 3600 * 1000);

    return {
      id: s._id ? s._id.toString() : `step-${i}`,
      name: s.title || `Step ${i + 1}`,
      start: start.toISOString(),
      end: end.toISOString(),
      progress: s.progress || 0,
      dependencies: (s.dependencies || []).map((d) => d.toString()),
    };
  });

  return tasks;
}
