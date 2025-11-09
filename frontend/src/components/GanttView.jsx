// src/components/GanttView.jsx
import React, { useEffect, useState } from 'react';
import { Chart } from 'react-google-charts';
import axios from 'axios';
import PropTypes from 'prop-types';

export default function GanttView({ roadmapId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roadmapId) return;
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        // Use GET unless you created POST endpoint
        const res = await axios.get(`/api/roadmap/${roadmapId}/gantt`);
        const tasks = res.data.tasks || [];

        // Google Charts expects first row of types
        const header = [
          { type: 'string', label: 'Task ID' },
          { type: 'string', label: 'Task Name' },
          { type: 'string', label: 'Resource' },
          { type: 'date', label: 'Start' },
          { type: 'date', label: 'End' },
          { type: 'number', label: 'Duration' },
          { type: 'number', label: 'Percent Complete' },
          { type: 'string', label: 'Dependencies' }
        ];

        const rows = tasks.map(t => [
          t.id,
          t.name,
          null,
          new Date(t.start),
          new Date(t.end),
          null,
          t.progress || 0,
          t.dependencies && t.dependencies.length ? t.dependencies.join(',') : null
        ]);

        if (mounted) setData([header, ...rows]);
      } catch (err) {
        console.error('Gantt fetch error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [roadmapId]);

  if (!roadmapId) return <div>No roadmap selected</div>;
  if (loading) return <div>Loading Gantt...</div>;
  if (!data) return <div>No tasks to display</div>;

  return (
    <Chart
      chartType="Gantt"
      width="100%"
      height="450px"
      data={data}
      options={{
        gantt: {
          trackHeight: 30
        }
      }}
    />
  );
}

GanttView.propTypes = {
  roadmapId: PropTypes.string.isRequired
};
