// frontend/src/components/RoadmapChart.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/**
 * Enhanced RoadmapChart
 *
 * Props:
 * - data: [{ id, title, description, durationLabel, durationDays, progress, videos, certs }]
 * - totalDurationDays: number (optional) - forces timeline to this total length
 * - onEditNode(node): function called when Edit clicked in modal (optional)
 *
 * Features:
 * - Zoom & pan controls
 * - Dates computed from durations
 * - Progress badges on nodes
 * - Export JSON + Download snapshot as PNG
 * - Compact/Expanded toggle
 */

const sampleData = [
  {
    id: "n1",
    title: "HTML & CSS",
    durationLabel: "2 weeks",
    durationDays: 14,
    description: "HTML structure, semantic tags, responsive layouts.",
    progress: 100,
    videos: [{ title: "HTML Crash", url: "https://youtu.be/UB1O30fR-EE" }],
    certs: [{ title: "FreeCodeCamp", url: "https://freecodecamp.org" }],
  },
  {
    id: "n2",
    title: "JS Fundamentals",
    durationLabel: "1 month",
    durationDays: 30,
    description: "ES6+, async, closures, DOM.",
    progress: 60,
    videos: [{ title: "JS Basics", url: "https://youtube.com" }],
    certs: [],
  },
  {
    id: "n3",
    title: "React",
    durationLabel: "3 weeks",
    durationDays: 21,
    description: "Components, hooks, state management.",
    progress: 25,
    videos: [],
    certs: [],
  },
  {
    id: "n4",
    title: "Full Project",
    durationLabel: "4 weeks",
    durationDays: 28,
    description: "Build & deploy a full project.",
    progress: 0,
    videos: [],
    certs: [],
  },
];

/* ------- Helpers ------- */
function parseDurationLabelToDays(label) {
  if (!label || typeof label !== "string") return null;
  const s = label.trim().toLowerCase();
  // basic patterns: "2 weeks", "1 month", "3 days", "1 year"
  const m = s.match(/([\d.]+)\s*(day|days|week|weeks|month|months|year|years)/);
  if (!m) return null;
  const val = parseFloat(m[1]);
  const unit = m[2];
  if (unit.startsWith("day")) return Math.round(val);
  if (unit.startsWith("week")) return Math.round(val * 7);
  if (unit.startsWith("month")) return Math.round(val * 30);
  if (unit.startsWith("year")) return Math.round(val * 365);
  return null;
}

function daysToDateString(baseDate, offsetDays) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + Math.round(offsetDays));
  return d.toLocaleDateString();
}

/* ------- Custom Dot (clickable node with progress badge) ------- */
function CustomDot({ cx, cy, payload, onClick, isActive, compact }) {
  if (cx == null || cy == null) return null;
  const r = isActive ? 10 : 7;
  const stroke = isActive ? "#1e40af" : "#475569";
  const fill = isActive ? "#bfdbfe" : "#ffffff";
  const progress = payload.progress ?? 0;

  return (
    <g transform={`translate(${cx}, ${cy})`} style={{ cursor: "pointer" }}>
      <circle
        r={r}
        stroke={stroke}
        strokeWidth={2}
        fill={fill}
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) onClick(payload);
        }}
        tabIndex={0}
        role="button"
        aria-label={`Open ${payload.title}`}
      />
      {/* progress small arc / badge */}
      <g transform={`translate(${r + 8}, ${-r - 6})`}>
        <rect
          rx={6}
          ry={6}
          width={compact ? 26 : 40}
          height={14}
          fill="#111827"
          opacity={0.9}
        />
        <text
          x={6}
          y={10}
          fontSize={compact ? 8 : 10}
          fill="#fff"
          style={{ fontFamily: "Inter, Arial, sans-serif" }}
        >
          {Math.round(progress)}%
        </text>
      </g>
    </g>
  );
}

/* ------- Main Component ------- */
export default function RoadmapChart({
  data = sampleData,
  totalDurationDays,
  onEditNode,
  startDate = new Date(),
}) {
  // state: compact/expanded, zoom & pan, modal
  const [compact, setCompact] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [zoom, setZoom] = useState(1); // 1 = show all, >1 zoomed in
  const [panOffset, setPanOffset] = useState(0); // in chart x units
  const chartRef = useRef(null);
  const svgRef = useRef(null);

  // derive durations (days) for each node; if absent, try to parse durationLabel;
  // if still absent, give 1 day placeholder and later use proportional spacing fallback
  const withDurations = useMemo(() => {
    return data.map((n) => {
      const dd = n.durationDays ?? parseDurationLabelToDays(n.durationLabel) ?? null;
      return { ...n, durationDays: dd };
    });
  }, [data]);

  // compute timeline total
  const computedTotalDays = useMemo(() => {
    if (typeof totalDurationDays === "number" && totalDurationDays > 0) return totalDurationDays;
    const sumKnown = withDurations.reduce((s, n) => s + (n.durationDays || 0), 0);
    if (sumKnown > 0) return sumKnown;
    // fallback: equal spacing -> use number of nodes as days (1 per node)
    return Math.max(1, withDurations.length);
  }, [withDurations, totalDurationDays]);

  // compute node cumulative start & end offsets (days)
  const nodesWithOffsets = useMemo(() => {
    const nodes = [];
    let cursor = 0;
    // if some nodes missing durations -> give them proportional share of remaining days
    const knownSum = withDurations.reduce((s, n) => s + (n.durationDays || 0), 0);
    const missing = withDurations.filter((n) => !n.durationDays).length;
    let remaining = computedTotalDays - knownSum;
    if (remaining < 0) remaining = 0;
    const share = missing > 0 ? Math.max(1, Math.round(remaining / missing)) : 0;

    withDurations.forEach((n) => {
      const dur = n.durationDays ?? share ?? 1;
      const start = cursor;
      const end = cursor + dur;
      nodes.push({ ...n, startDays: start, endDays: end, durationDays: dur });
      cursor = end;
    });
    return nodes;
  }, [withDurations, computedTotalDays]);

  // map nodes to chart x coordinates: use cumulative middle point for each node
  const chartData = useMemo(() => {
    const total = nodesWithOffsets.length ? nodesWithOffsets[nodesWithOffsets.length - 1].endDays : 1;
    return nodesWithOffsets.map((n, idx) => {
      const mid = (n.startDays + n.endDays) / 2;
      // scale x into 0..total for recharts numeric axis
      return { x: mid, y: 0, ...n, index: idx };
    });
  }, [nodesWithOffsets]);

  // domain control (zoom & pan). We'll allow zoom factor between 1 (full) and 6 (very zoomed).
  const minZoom = 1;
  const maxZoom = 6;
  const visibleWindowDays = useMemo(() => {
    const totalRange = chartData.length ? chartData[chartData.length - 1].x - chartData[0].x : 1;
    return Math.max(1, totalRange / zoom);
  }, [chartData, zoom]);

  // compute domain start/end using pan offset (panOffset in days units)
  const computeDomain = () => {
    if (!chartData || chartData.length === 0) return ["auto", "auto"];
    const minX = chartData[0].x;
    const maxX = chartData[chartData.length - 1].x;
    const center = (minX + maxX) / 2 + panOffset;
    let half = visibleWindowDays / 2;
    let start = center - half;
    let end = center + half;
    // clamp
    if (start < minX) {
      start = minX;
      end = Math.min(start + visibleWindowDays, maxX);
    }
    if (end > maxX) {
      end = maxX;
      start = Math.max(end - visibleWindowDays, minX);
    }
    return [start, end];
  };

  const [domainStart, domainEnd] = computeDomain();

  // zoom & pan handlers
  const zoomIn = () => setZoom((z) => Math.min(maxZoom, +(z * 1.4).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(minZoom, +(z / 1.4).toFixed(2)));
  const panLeft = () => setPanOffset((p) => p - visibleWindowDays * 0.25);
  const panRight = () => setPanOffset((p) => p + visibleWindowDays * 0.25);
  const resetView = () => {
    setZoom(1);
    setPanOffset(0);
  };

  // mouse wheel zoom (over chart area)
  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const wheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        // don't hijack ctrl+wheel browser zoom
        return;
      }
      e.preventDefault();
      const delta = e.deltaY;
      if (delta > 0) zoomOut();
      else zoomIn();
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [chartRef, zoomIn, zoomOut]);

  // keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (!chartData || chartData.length === 0) return;
      const idx = chartData.findIndex((n) => n.id === activeId);
      if (e.key === "ArrowRight") {
        const next = Math.min(chartData.length - 1, idx === -1 ? 0 : idx + 1);
        setActiveId(chartData[next].id);
      } else if (e.key === "ArrowLeft") {
        const prev = Math.max(0, idx === -1 ? 0 : idx - 1);
        setActiveId(chartData[prev].id);
      } else if (e.key === "Enter" && activeId) {
        const node = chartData.find((n) => n.id === activeId);
        if (node) setSelectedNode(node);
      } else if (e.key === "Escape") {
        setSelectedNode(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chartData, activeId]);

  // open modal
  const openModal = (payload) => {
    setSelectedNode(payload);
    setActiveId(payload?.id);
  };
  const closeModal = () => {
    setSelectedNode(null);
    setActiveId(null);
  };

  // export JSON
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roadmap.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // download SVG as PNG (approx): we take the first SVG inside chart container
  const downloadPNG = async () => {
    try {
      const container = svgRef.current;
      if (!container) {
        alert("Snapshot not available.");
        return;
      }
      // find svg
      const svg = container.querySelector("svg");
      if (!svg) {
        alert("SVG not found.");
        return;
      }
      // inline CSS: compute styles and embed; simplest option: serialize svg node
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        // white background
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const png = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = png;
        a.download = "roadmap.png";
        a.click();
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        alert("Failed to render snapshot.");
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      console.error(err);
      alert("Error exporting snapshot.");
    }
  };

  // helper for tick labels: show title (short) and date beneath (compact mode only shows short)
  const tickFormatter = (xValue) => {
    const node = chartData.find((n) => Math.abs(n.x - xValue) < 0.0001);
    if (!node) {
      // show date label based on xValue days offset
      const d = daysToDateString(startDate, xValue);
      return d;
    }
    const title = node.title.length > (compact ? 10 : 14) ? node.title.slice(0, compact ? 9 : 13) + "…" : node.title;
    const dateLabel = `${daysToDateString(startDate, node.startDays)} - ${daysToDateString(startDate, node.endDays - 1)}`;
    return `${title}\n${compact ? daysToDateString(startDate, node.startDays) : dateLabel}`;
  };

  // parent container style to ensure Recharts can measure
  const parentStyle = {
    width: "100%",
    height: compact ? "220px" : "380px",
    minWidth: 0,
    minHeight: 180,
    padding: 8,
    boxSizing: "border-box",
  };

  return (
    <>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={zoomIn} title="Zoom in">🔍+</button>
          <button onClick={zoomOut} title="Zoom out">🔍-</button>
          <button onClick={panLeft} title="Pan left">◀</button>
          <button onClick={panRight} title="Pan right">▶</button>
          <button onClick={resetView} title="Reset view">⤾</button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setCompact((c) => !c)}>{compact ? "Expanded" : "Compact"}</button>
          <button onClick={exportJSON}>Export JSON</button>
          <button onClick={downloadPNG}>Download PNG</button>
        </div>

        <div style={{ marginLeft: "auto", color: "#475569", fontSize: 13 }}>
          Total timeline: {computedTotalDays} days
        </div>
      </div>

      <div ref={svgRef} style={parentStyle} className="roadmap-chart-root">
        <div ref={chartRef} style={{ width: "100%", height: "100%", minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: compact ? 36 : 64 }}
            >
              <CartesianGrid vertical={false} horizontal={false} />
              <XAxis
                dataKey="x"
                type="number"
                domain={[domainStart, domainEnd]}
                tickFormatter={(v) => {
                  // Recharts expects a single-line string; we create small multiline by using \n (some renderers show it)
                  return tickFormatter(v);
                }}
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fontSize: compact ? 10 : 12 }}
                allowDecimals={true}
                height={compact ? 50 : 80}
              />
              <YAxis hide dataKey="y" />
              <Tooltip
                wrapperStyle={{ zIndex: 1000 }}
                formatter={() => null}
                labelFormatter={(value) => {
                  const node = chartData.find((n) => Math.abs(n.x - value) < 0.0001);
                  return node ? node.title : daysToDateString(startDate, value);
                }}
                contentStyle={{ borderRadius: 8 }}
              />

              {/* Invisible connecting line (we hide stroke but use dots) */}
              <Line
                type="monotone"
                dataKey="y"
                stroke="#CBD5E0"
                strokeWidth={1}
                dot={(dotProps) => {
                  // strip key from dotProps before spreading to CustomDot
                  const { key: _k, ...rest } = dotProps || {};
                  const payload = rest.payload || {};
                  const isActive = payload.id === activeId;
                  return (
                    <CustomDot
                      {...rest}
                      onClick={() => openModal(payload)}
                      isActive={isActive}
                      compact={compact}
                    />
                  );
                }}
                activeDot={false}
                strokeOpacity={0}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal */}
      {selectedNode && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: 20,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              width: "min(920px, 96%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 10,
              padding: 20,
              boxShadow: "0 12px 40px rgba(2,6,23,0.35)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h2 style={{ margin: 0 }}>{selectedNode.title}</h2>
                <div style={{ color: "#4b5563", marginTop: 6 }}>
                  {selectedNode.durationLabel ?? `${selectedNode.durationDays} days`} • Progress:{" "}
                  {selectedNode.progress ?? 0}%
                </div>
                <div style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>
                  {daysToDateString(startDate, selectedNode.startDays)} —{" "}
                  {daysToDateString(startDate, selectedNode.endDays - 1)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {onEditNode && (
                  <button
                    onClick={() => onEditNode(selectedNode)}
                    style={{
                      background: "#111827",
                      color: "#fff",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={closeModal}
                  aria-label="Close"
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 18,
                    cursor: "pointer",
                    color: "#718096",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <hr style={{ margin: "12px 0 18px" }} />

            <section style={{ marginBottom: 14 }}>
              <h4 style={{ marginBottom: 8 }}>Description</h4>
              <p style={{ marginTop: 0, color: "#374151" }}>{selectedNode.description}</p>
            </section>

            <section style={{ marginBottom: 14 }}>
              <h4 style={{ marginBottom: 8 }}>Suggested Videos</h4>
              {selectedNode.videos && selectedNode.videos.length > 0 ? (
                <ul style={{ marginTop: 0 }}>
                  {selectedNode.videos.map((v, i) => (
                    <li key={i}>
                      <a href={v.url} target="_blank" rel="noreferrer">
                        {v.title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ color: "#6b7280" }}>No videos suggested.</div>
              )}
            </section>

            <section style={{ marginBottom: 14 }}>
              <h4 style={{ marginBottom: 8 }}>Certifications</h4>
              {selectedNode.certs && selectedNode.certs.length > 0 ? (
                <ul style={{ marginTop: 0 }}>
                  {selectedNode.certs.map((c, i) => (
                    <li key={i}>
                      <a href={c.url} target="_blank" rel="noreferrer">
                        {c.title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ color: "#6b7280" }}>No certifications suggested.</div>
              )}
            </section>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button
                onClick={closeModal}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #CBD5E0",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
