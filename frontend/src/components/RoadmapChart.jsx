import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

// Helper: parse a time string into months (number)
const parseToMonths = (str) => {
  if (!str || typeof str !== "string") return 0;
  const s = str.trim().toLowerCase();
  const numMatch = s.match(/([0-9]*\.?[0-9]+)/);
  const num = numMatch ? parseFloat(numMatch[1]) : null;
  if (!num && num !== 0) return 0;
  if (s.includes("week")) return num / 4; // approximate 4 weeks per month
  if (s.includes("day")) return num / 30; // approximate
  return num; // assume months
};

const buildChartData = (steps) => {
  let cum = 0;
  return steps.map((s, i) => {
    const months = parseToMonths(s.estimatedTime || s.duration || "0");
    cum += months;
    return {
      name: s.title || s.phase || `Step ${i + 1}`,
      months: Math.round(cum * 100) / 100, // round to 2 decimals
      stepMonths: Math.round(months * 100) / 100,
      index: i,
      description: s.description || s.desc || "",
    };
  });
};

// Custom dot renderer that is clickable and accessible
const ClickableDot = ({ cx, cy, payload, index, onClick, isActive }) => {
  if (cx === undefined || cy === undefined) return null;
  const base = {
    r: isActive ? 6 : 4,
    stroke: isActive ? "#1D4ED8" : "#2563EB",
    strokeWidth: isActive ? 3 : 2,
    fill: isActive ? "#60A5FA" : "#fff",
    cursor: onClick ? "pointer" : "default",
  };
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={base.r}
        stroke={base.stroke}
        strokeWidth={base.strokeWidth}
        fill={base.fill}
        onClick={() => onClick && onClick(index)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && onClick) onClick(index);
        }}
        role={onClick ? "button" : undefined}
        aria-label={onClick ? `Open milestone ${payload?.name || index + 1}` : undefined}
        tabIndex={onClick ? 0 : undefined}
      />
    </g>
  );
};

export default function RoadmapChart({ steps = [], height = 280, onPointClick }) {
  const chartData = useMemo(() => buildChartData(steps), [steps]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Compute Y domain max (ensure some padding)
  const maxMonths = chartData.length ? Math.max(...chartData.map((d) => d.months)) : 1;
  const yMax = Math.ceil(maxMonths + Math.max(1, maxMonths * 0.08)); // add ~8% padding

  // Handler wrapper to be defensive and to also set local selected state
  const handlePointClick = (idx) => {
    if (typeof idx !== "number") return;
    setSelectedIndex(idx);
    if (typeof onPointClick === "function") {
      const step = steps[idx] ?? null;
      try {
        onPointClick(idx, step);
      } catch (e) {
        // swallow to avoid breaking chart clicks
        console.error("onPointClick handler error:", e);
      }
    }
  };

  // total months nicely formatted
  const totalMonths = chartData.length > 0 ? chartData[chartData.length - 1].months.toFixed(2) : "0.00";

  return (
    // outer wrapper must allow measuring by ResponsiveContainer.
    // minWidth:0 prevents flex children from causing -1 width in some layouts.
    <div className="max-w-5xl mx-auto p-4" style={{ minWidth: 0 }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4" style={{ minWidth: 0 }}>
        <h3 className="text-xl font-semibold mb-3">Roadmap Overview</h3>

        {/* Timeline (horizontal scroll on small screens) */}
        <div className="overflow-x-auto">
          <div className="flex items-start gap-6 px-2 py-4" style={{ minWidth: 0 }}>
            {steps.map((s, i) => (
              // flex-shrink-0 w-64 is fine for desktop; adding min-w-0 allows shrink inside flex parents
              <div key={i} className="flex-shrink-0 w-64" style={{ minWidth: 0 }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-white dark:ring-gray-900" />
                  <div>
                    <div className="font-semibold">{s.title || s.phase || `Step ${i + 1}`}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {s.estimatedTime || s.duration || "Unspecified"}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  {s.description || s.desc || "No description provided."}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="mt-6" style={{ height, minWidth: 0 }}>
          {chartData.length === 0 ? (
            <div className="text-center text-gray-500">No data to chart. Generate a roadmap first.</div>
          ) : (
            // ResponsiveContainer requires parent with explicit height (we provide it above),
            // and minWidth:0 to avoid flex measurement issues.
            <div style={{ width: "100%", height: "100%", minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, yMax]} label={{ value: "Cumulative months", angle: -90, position: "insideLeft", offset: 10 }} />
                  <Tooltip
                    formatter={(val, name) => {
                      if (name === "months") return `${val} months (cumulative)`;
                      return val;
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="months"
                    stroke="#2563EB"
                    strokeWidth={3}
                    dot={(props) => (
                      <ClickableDot
                        {...props}
                        index={props.index}
                        onClick={handlePointClick}
                        isActive={selectedIndex === props.index}
                      />
                    )}
                    activeDot={(props) => (
                      <ClickableDot
                        {...props}
                        index={props.index}
                        onClick={handlePointClick}
                        isActive={selectedIndex === props.index}
                      />
                    )}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="mt-4 flex flex-wrap gap-4" style={{ minWidth: 0 }}>
          <div className="px-4 py-2 rounded bg-gray-50 dark:bg-gray-700">
            <div className="text-sm text-gray-500">Phases</div>
            <div className="font-bold">{steps.length}</div>
          </div>
          <div className="px-4 py-2 rounded bg-gray-50 dark:bg-gray-700">
            <div className="text-sm text-gray-500">Estimated total</div>
            <div className="font-bold">{chartData.length > 0 ? `${totalMonths} months` : "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
