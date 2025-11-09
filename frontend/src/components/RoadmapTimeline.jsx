// src/components/RoadmapTimeline.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";

/**
 Props:
  - data: [{ id, title, description, durationLabel, durationDays, progress, videos, certs }]
  - totalDurationDays (optional)
  - startDate (optional, Date or string)
  - onEditNode(node) (optional)
*/

const SAMPLE = [
  { id: "n1", title: "HTML & CSS", description: "Basics", durationDays: 14, durationLabel: "2 weeks", progress: 100, videos: [], certs: [] },
  { id: "n2", title: "JS Fundamentals", description: "JS", durationDays: 30, durationLabel: "1 month", progress: 60, videos: [], certs: [] },
  { id: "n3", title: "React", description: "React basics", durationDays: 21, durationLabel: "3 weeks", progress: 25, videos: [], certs: [] },
  { id: "n4", title: "Full Project", description: "Build it", durationDays: 28, durationLabel: "4 weeks", progress: 0, videos: [], certs: [] },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function daysToDate(base, offset) {
  const d = new Date(base);
  d.setDate(d.getDate() + Math.round(offset));
  return d.toLocaleDateString();
}

export default function RoadmapTimeline({
  data = SAMPLE,
  totalDurationDays,
  startDate = new Date(),
  onEditNode,
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // compute durations
  const withDur = useMemo(() => data.map((n) => ({ ...n, durationDays: n.durationDays ?? 1 })), [data]);

  const computedTotal = useMemo(() => {
    if (typeof totalDurationDays === "number" && totalDurationDays > 0) return totalDurationDays;
    const sum = withDur.reduce((s, n) => s + (n.durationDays || 0), 0);
    return Math.max(1, sum || withDur.length);
  }, [withDur, totalDurationDays]);

  // compute cumulative positions (0..100%)
  const nodes = useMemo(() => {
    let cursor = 0;
    const out = withDur.map((n) => {
      const start = cursor;
      const end = cursor + (n.durationDays || 0);
      const center = (start + end) / 2;
      cursor = end;
      return { ...n, start, end, center };
    });
    // convert to percent
    return out.map((n) => ({ ...n, pct: (n.center / computedTotal) * 100 }));
  }, [withDur, computedTotal]);

  // zoom & pan
  const [zoom, setZoom] = useState(1); // 1..4
  const [pan, setPan] = useState(0); // px offset
  const minZoom = 1;
  const maxZoom = 3.5;

  const zoomIn = () => setZoom((z) => clamp(+z + 0.4, minZoom, maxZoom));
  const zoomOut = () => setZoom((z) => clamp(+z - 0.4, minZoom, maxZoom));
  const panLeft = () => setPan((p) => p + 120);
  const panRight = () => setPan((p) => p - 120);
  const resetView = () => { setZoom(1); setPan(0); };

  // active & modal
  const [activeId, setActiveId] = useState(null);
  const [selected, setSelected] = useState(null);

  // keyboard nav
  useEffect(() => {
    const onKey = (e) => {
      if (!nodes.length) return;
      const idx = nodes.findIndex((n) => n.id === activeId);
      if (e.key === "ArrowRight") setActiveId(nodes[clamp(idx + 1, 0, nodes.length - 1)].id);
      if (e.key === "ArrowLeft") setActiveId(nodes[clamp(idx - 1, 0, nodes.length - 1)].id);
      if (e.key === "Enter" && activeId) {
        setSelected(nodes.find((n) => n.id === activeId));
      }
      if (e.key === "Escape") {
        setSelected(null);
        setActiveId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nodes, activeId]);

  // snapshot export (svg -> png)
  const exportPNG = async () => {
    const svgEl = svgRef.current;
    if (!svgEl) return alert("No chart found");
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "roadmap_snapshot.png";
      a.click();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      alert("Failed to export snapshot.");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roadmap.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // visual constants
  const height = 220;
  const baselineY = 120;
  const nodeY = baselineY;
  const leftPadding = 60;
  const rightPadding = 60;

  // compute SVG world width based on container or fallback
  const containerWidth = containerRef.current?.clientWidth || 1000;
  const worldWidth = Math.max(800, (containerWidth - leftPadding - rightPadding) * Math.max(1, zoom));

  // map pct to x in px
  const pctToX = (pct) => {
    const inner = worldWidth;
    return leftPadding + (pct / 100) * inner;
  };

  // progress ring helpers
  const circleRadius = 12;
  const circumference = 2 * Math.PI * circleRadius;

  // animations: simple fade-in
  useEffect(() => {
    const nodesEl = svgRef.current?.querySelectorAll?.(".rm-node");
    if (nodesEl?.length) {
      nodesEl.forEach((el, i) => {
        el.style.opacity = 0;
        el.style.transform = "translateY(8px)";
        setTimeout(() => {
          el.style.transition = "opacity 420ms ease, transform 420ms cubic-bezier(.2,.9,.3,1)";
          el.style.opacity = 1;
          el.style.transform = "translateY(0)";
        }, 80 * i);
      });
    }
  }, [data, zoom, pan]);

  return (
    <div style={{ padding: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Your Roadmap</h2>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={zoomIn} aria-label="Zoom in">🔎+</button>
          <button onClick={zoomOut} aria-label="Zoom out">🔎-</button>
          <button onClick={panLeft} aria-label="Pan left">◀</button>
          <button onClick={panRight} aria-label="Pan right">▶</button>
          <button onClick={resetView} aria-label="Reset">⤾</button>
          <button onClick={() => { exportJSON(); }} aria-label="Export JSON">Export JSON</button>
          <button onClick={exportPNG} aria-label="Download PNG">Download PNG</button>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          overflow: "hidden",
          borderRadius: 12,
          background: "#fff",
          padding: 12,
          boxShadow: "0 6px 22px rgba(10,10,20,0.04)",
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          viewBox={`0 0 ${leftPadding + worldWidth + rightPadding} ${height}`}
          role="img"
          style={{ display: "block", userSelect: "none" }}
        >
          {/* Background subtle gradient */}
          <defs>
            <linearGradient id="g-line" x1="0" x2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.95" />
            </linearGradient>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Baseline */}
          <g transform={`translate(${pan}, 0)` /* pan by px */}>
            <rect
              x={leftPadding}
              y={baselineY - 8}
              width={worldWidth}
              height={16}
              rx={8}
              fill="#eef2ff"
              filter="url(#shadow)"
            />
            {/* gradient thin line on top */}
            <rect x={leftPadding} y={baselineY - 2} width={worldWidth} height={4} rx={2} fill="url(#g-line)" />

            {/* nodes */}
            {nodes.map((n, idx) => {
              const x = pctToX(n.pct);
              const startDateStr = daysToDate(startDate, n.start);
              const endDateStr = daysToDate(startDate, Math.max(0, n.end - 1));
              const titleShort = n.title.length > 18 ? n.title.slice(0, 16) + "…" : n.title;

              const progress = clamp(Number(n.progress ?? 0), 0, 100);
              const dash = (progress / 100) * circumference;
              const gap = Math.max(0, circumference - dash);

              const isActive = activeId === n.id || selected?.id === n.id;

              return (
                <g
                  key={n.id}
                  className="rm-node"
                  transform={`translate(${x}, ${nodeY})`}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setActiveId(n.id)}
                  onMouseLeave={() => setActiveId((cur) => (cur === n.id ? null : cur))}
                  onClick={() => { setSelected(n); setActiveId(n.id); }}
                >
                  {/* connector shadow */}
                  <line x1={0} y1={-nodeY + baselineY} x2={0} y2={-10} stroke="rgba(0,0,0,0.04)" strokeWidth={6} strokeLinecap="round" />

                  {/* outer progress ring */}
                  <g transform={`translate(0, 0)`}>
                    <circle cx={0} cy={0} r={circleRadius} fill="#fff" stroke="#CBD5E0" strokeWidth={2} />
                    <circle
                      cx={0}
                      cy={0}
                      r={circleRadius}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={3}
                      strokeDasharray={`${dash} ${gap}`}
                      strokeLinecap="round"
                      transform={`rotate(-90)`}
                      style={{ transition: "stroke-dasharray 400ms ease" }}
                    />
                    {/* inner dot */}
                    <circle cx={0} cy={0} r={circleRadius - 6} fill={isActive ? "#0ea5e9" : "#94a3b8"} />
                  </g>

                  {/* label above */}
                  <foreignObject x={-120} y={-64} width={240} height={48} style={{ overflow: "visible" }}>
                    <div style={{
                      width: 240,
                      textAlign: "center",
                      pointerEvents: "none",
                    }}>
                      <div style={{
                        display: "inline-block",
                        padding: "6px 10px",
                        background: isActive ? "#111827" : "#10101010",
                        color: isActive ? "#fff" : "#111827",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 600,
                      }}>
                        {titleShort}
                      </div>
                    </div>
                  </foreignObject>

                  {/* date below */}
                  <text y={32} x={0} textAnchor="middle" style={{ fontSize: 12, fill: "#4b5563" }}>
                    {startDateStr} — {endDateStr}
                  </text>

                  {/* small progress badge near top-right */}
                  <g transform={`translate(${circleRadius + 18}, ${-circleRadius - 10})`}>
                    <rect rx={8} ry={8} width={48} height={20} fill="#111827" opacity={0.85} />
                    <text x={24} y={14} textAnchor="middle" style={{ fontSize: 11, fill: "#fff" }}>
                      {Math.round(progress)}%
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div style={{ marginTop: 12, color: "#6b7280", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>Total: {computedTotal} days • Nodes: {nodes.length}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setPan(0); setZoom(1); }}>Reset</button>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div
          onClick={() => { setSelected(null); setActiveId(null); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 4000,
            padding: 20,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(900px, 96%)", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 10, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>{selected.title}</h3>
                <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>
                  {selected.durationLabel ?? `${selected.durationDays} days`} • Progress: {selected.progress ?? 0}%
                </div>
                <div style={{ color: "#6b7280", fontSize: 13 }}>
                  {daysToDate(startDate, selected.start)} — {daysToDate(startDate, selected.end - 1)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {onEditNode && <button onClick={() => onEditNode(selected)}>Edit</button>}
                <button onClick={() => { setSelected(null); setActiveId(null); }}>Close</button>
              </div>
            </div>

            <hr style={{ margin: "12px 0" }} />

            <section style={{ marginBottom: 12 }}>
              <h4 style={{ margin: "6px 0" }}>Description</h4>
              <p style={{ marginTop: 0 }}>{selected.description}</p>
            </section>

            <section style={{ marginBottom: 12 }}>
              <h4 style={{ margin: "6px 0" }}>Suggested Videos</h4>
              {selected.videos && selected.videos.length ? <ul>{selected.videos.map((v, i) => <li key={i}><a href={v.url} target="_blank" rel="noreferrer">{v.title || v.url}</a></li>)}</ul> : <div style={{ color: "#6b7280" }}>No videos</div>}
            </section>

            <section style={{ marginBottom: 12 }}>
              <h4 style={{ margin: "6px 0" }}>Certifications</h4>
              {selected.certs && selected.certs.length ? <ul>{selected.certs.map((c, i) => <li key={i}><a href={c.url} target="_blank" rel="noreferrer">{c.title || c.url}</a></li>)}</ul> : <div style={{ color: "#6b7280" }}>No certifications</div>}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
