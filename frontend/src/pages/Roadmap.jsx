// frontend/src/pages/Roadmap.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import { Loader2, ChevronDown, ArrowRight, Share2, Save, Download, Repeat, Copy, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
// External libs required: html2canvas, jspdf
// npm i html2canvas jspdf
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/*
  Full patched Roadmap.jsx
  - Fixed durationValue/durationUnit ReferenceError in handleSave
  - Adds per-node detail fetching (with placeholder fallback) so modal shows videos/certs
  - Uses exportRef.current for PDF export if available
  - Keeps the rest of your UI and behavior intact
*/

/* ---------------- constants & utils ---------------- */
const SUGGESTED_GOALS = [
  "Data Scientist",
  "Full Stack Developer",
  "Cybersecurity Analyst",
  "UI/UX Designer",
  "AI Engineer",
  "Cloud Architect",
  "Digital Marketer",
  "Product Manager",
  "Mobile App Developer",
  "Game Developer",
];

const DURATION_UNITS = ["days", "weeks", "months", "years"];
const TOAST_TYPES = { INFO: "info", SUCCESS: "success", ERROR: "error" };

/* ---------------- Toast system ---------------- */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(1);
  const push = (msg, type = TOAST_TYPES.INFO, opts = {}) => {
    const id = idRef.current++;
    const t = { id, msg, type, ...opts };
    setToasts((s) => [...s, t]);
    if (!opts.persistent) {
      setTimeout(() => remove(id), opts.duration || 4500);
    }
    return id;
  };
  const remove = (id) => setToasts((s) => s.filter((t) => t.id !== id));
  return { toasts, push, remove };
}

function Toasts({ toasts, onRemove }) {
  return (
    <div aria-live="polite" className="fixed top-6 right-6 z-50 flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 8, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className={`max-w-sm w-full rounded-md shadow-lg px-4 py-2 text-sm flex items-start gap-3 ring-1 ${
              t.type === TOAST_TYPES.ERROR
                ? "bg-[#fff1f2] text-[#7f1d1d] ring-[#fecaca]"
                : t.type === TOAST_TYPES.SUCCESS
                ? "bg-[#ecfdf5] text-[#064e3b] ring-[#bbf7d0]"
                : "bg-white text-slate-900 ring-slate-100"
            }`}
          >
            <div className="flex-1">
              {t.title && <div className="font-semibold">{t.title}</div>}
              <div>{t.msg}</div>
            </div>
            <div className="flex flex-col items-end">
              {t.action && (
                <button onClick={() => t.action.onClick()} className="text-xs underline">
                  {t.action.label}
                </button>
              )}
              <button aria-label="dismiss" onClick={() => onRemove(t.id)} className="text-xs opacity-60 mt-2">
                Dismiss
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Loading overlay ---------------- */
function LoadingOverlay({ visible, message = "Generating timeline — sit back and relax..." }) {
  if (!visible) return null;
  return (
    <div aria-hidden={!visible} role="status" className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-white/60 to-transparent backdrop-blur-sm">
      <div className="w-full max-w-3xl mx-4 rounded-xl p-6 bg-white/90 dark:bg-gray-900/90 border shadow-lg">
        <div className="flex items-center gap-4">
          <svg width="84" height="84" viewBox="0 0 120 120" className="flex-none">
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <g>
              <circle cx="36" cy="36" r="22" fill="url(#g1)">
                <animate attributeName="cy" dur="3.8s" values="36;28;36;44;36" repeatCount="indefinite" />
                <animate attributeName="cx" dur="5.5s" values="36;42;36;30;36" repeatCount="indefinite" />
                <animate attributeName="r" dur="6.2s" values="20;24;20;18;20" repeatCount="indefinite" />
              </circle>
              <circle cx="84" cy="72" r="18" fill="#93c5fd" opacity="0.75">
                <animate attributeName="cy" dur="4.6s" values="72;64;72;80;72" repeatCount="indefinite" />
                <animate attributeName="cx" dur="5.8s" values="84;78;84;90;84" repeatCount="indefinite" />
              </circle>
              <circle cx="64" cy="40" r="12" fill="#c4b5fd" opacity="0.85">
                <animate attributeName="cx" dur="6s" values="64;70;64;58;64" repeatCount="indefinite" />
                <animate attributeName="cy" dur="4.2s" values="40;34;40;46;40" repeatCount="indefinite" />
              </circle>
            </g>
          </svg>

          <div className="flex-1">
            <div className="text-lg font-semibold mb-1">{message}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">We are crafting a calm, structured 10-step timeline for your goal. This usually takes a few seconds.</div>
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse w-3/4 mb-2" />
                    <div className="h-2 rounded bg-gray-200 dark:bg-gray-700 animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-none w-12">
            <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- RoadmapItem ---------------- */
function RoadmapItem({ step, defaultCollapsed = false, isOpen: controlledIsOpen, onToggle, highlighted }) {
  const [open, setOpen] = useState(!defaultCollapsed);
  useEffect(() => {
    if (typeof controlledIsOpen === "boolean") setOpen(controlledIsOpen);
  }, [controlledIsOpen]);

  const toggle = () => {
    if (typeof onToggle === "function") onToggle(!open);
    setOpen((s) => !s);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`relative ${highlighted ? "ring-4 ring-yellow-300/60 rounded-lg" : ""}`}>
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <span className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-white dark:ring-gray-900" />
          <div className="w-px bg-gray-200 dark:bg-gray-700 flex-1" />
        </div>

        <div className="flex-1 bg-white dark:bg-gray-800 border rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-3">
                {step.title}
                {step.level && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                      step.level === "beginner" ? "bg-green-100 text-green-800" : step.level === "intermediate" ? "bg-amber-100 text-amber-800" : "bg-violet-100 text-violet-800"
                    }`}
                  >
                    {step.level[0].toUpperCase() + step.level.slice(1)}
                  </span>
                )}
              </h3>
              {step.estimatedTime && <div className="text-sm text-gray-500 dark:text-gray-400">Estimated: {step.estimatedTime}</div>}
              {step.startDate && step.endDate && (
                <div className="text-xs text-gray-400 mt-1">
                  {(() => {
                    const a = parseLocalDate(step.startDate);
                    const b = parseLocalDate(step.endDate);
                    if (a && b) return `${a.toLocaleDateString()} — ${b.toLocaleDateString()}`;
                    return "";
                  })()}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={toggle} aria-expanded={open} className="px-3 py-1 rounded-md text-sm bg-gray-100 dark:bg-gray-700 hover:opacity-90">
                {open ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="mt-3 text-gray-700 dark:text-gray-300">
                <p>{step.description}</p>
                {step.substeps && step.substeps.length > 0 && (
                  <ul className="mt-2 list-disc ml-5 text-sm text-gray-600 dark:text-gray-400">
                    {step.substeps.map((ss, i) => (
                      <li key={i}>{ss}</li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- Helpers: parse duration text -> days ---------------- */
const parseEstimatedToDays = (text) => {
  if (!text) return 7;
  const s = String(text).toLowerCase();
  const numMatch = s.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/);
  const unitMatch = s.match(/(day|days|week|weeks|wk|wks|month|months|mo|mos|year|years|yr|yrs)/);
  if (!numMatch) return 7;
  const a = parseFloat(numMatch[1]);
  const b = numMatch[2] ? parseFloat(numMatch[2]) : null;
  const value = b ? (a + b) / 2 : a;
  const unit = unitMatch ? unitMatch[0] : "days";
  if (unit.startsWith("day")) return Math.max(1, Math.round(value));
  if (unit.startsWith("week") || unit === "wk" || unit === "wks" || unit === "w") return Math.max(1, Math.round(value * 7));
  if (unit.startsWith("month") || unit === "mo" || unit === "mos") return Math.max(7, Math.round(value * 30));
  if (unit.startsWith("year") || unit === "yr" || unit === "yrs") return Math.max(30, Math.round(value * 365));
  return Math.max(1, Math.round(value));
};

const normalizeRoadmapWithDurations = (raw) => {
  const normalized = raw.map((s, i) => {
    const estimated = s.estimatedTime || s.estimated || s.duration || "";
    const days = parseEstimatedToDays(estimated);
    return {
      ...s,
      __index: i,
      __days: days,
      __label: s.title || s.name || `Step ${i + 1}`,
    };
  });
  return normalized;
};

/* ---------- date helpers (timezone-safe, local-date aware) ---------- */

// parse a date-like value into a Date object treating "YYYY-MM-DD" as local date
function parseLocalDate(input) {
  if (!input) return null;
  if (input instanceof Date) return input;
  const s = String(input);
  // if it's already an ISO with time, let Date handle it
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d); // local date at midnight
  }
  // fallback: Date will parse extended ISO strings; acceptable for server values
  const d = new Date(s);
  if (!isNaN(d)) return d;
  return null;
}

// return number of days inclusive between two local-date inputs
function daysBetweenInclusive(startInput, endInput) {
  const a = parseLocalDate(startInput);
  const b = parseLocalDate(endInput);
  if (!a || !b) return null;
  // compute diff in UTC days using year/month/day fields to avoid timezone shifts
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((utcB - utcA) / msPerDay);
  return diffDays >= 0 ? diffDays + 1 : null; // inclusive
}

// add days to a local-date input and return a local YYYY-MM-DD string
function addDaysLocal(isoOrDateLike, days) {
  const d = parseLocalDate(isoOrDateLike) || new Date();
  d.setDate(d.getDate() + Number(days || 0));
  // return YYYY-MM-DD (local)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}



// Merge two adjacent steps (combine titles, descriptions, substeps)
const mergeStepsAt = (steps, idx) => {
  if (idx < 0 || idx >= steps.length - 1) return steps;
  const a = steps[idx];
  const b = steps[idx + 1];
  const merged = {
    title: `${a.title} · ${b.title}`,
    description: `${a.description}${a.description && b.description ? " " : ""}${b.description}`,
    substeps: [...(a.substeps || []), ...(b.substeps || [])].slice(0, 50),
    estimatedTime: (a.estimatedTime || "") + " + " + (b.estimatedTime || ""),
    raw: { mergedFrom: [a.raw || a, b.raw || b] },
  };
  return [...steps.slice(0, idx), merged, ...steps.slice(idx + 2)];
};

const mergeUntilCount = (steps, targetCount) => {
  const work = steps.map((s, i) => ({ ...s, __days: parseEstimatedToDays(s.estimatedTime || s.duration || s.__days || "1") }));
  while (work.length > targetCount) {
    let minIdx = 0;
    for (let i = 1; i < work.length; i++) {
      if (work[i].__days < work[minIdx].__days) minIdx = i;
    }
    const left = minIdx - 1;
    const right = minIdx + 1;
    if (left >= 0 && right < work.length) {
      const mergeWithLeft = work[left].__days <= work[right].__days;
      if (mergeWithLeft) {
        const newSteps = mergeStepsAt(work, left);
        work.splice(0, work.length, ...newSteps.map((s) => ({ ...s, __days: parseEstimatedToDays(s.estimatedTime || s.__days || "1") })));
      } else {
        const newSteps = mergeStepsAt(work, minIdx);
        work.splice(0, work.length, ...newSteps.map((s) => ({ ...s, __days: parseEstimatedToDays(s.estimatedTime || s.__days || "1") })));
      }
    } else if (left >= 0) {
      const newSteps = mergeStepsAt(work, left);
      work.splice(0, work.length, ...newSteps.map((s) => ({ ...s, __days: parseEstimatedToDays(s.estimatedTime || s.__days || "1") })));
    } else if (right < work.length) {
      const newSteps = mergeStepsAt(work, minIdx);
      work.splice(0, work.length, ...newSteps.map((s) => ({ ...s, __days: parseEstimatedToDays(s.estimatedTime || s.__days || "1") })));
    } else {
      break;
    }
  }
  return work;
};

const assignDatesToSteps = (steps, startInput, endInput) => {
  // Use local-date aware helpers
  const availableDays = daysBetweenInclusive(startInput, endInput);
  if (!availableDays) return steps.map((s) => ({ ...s }));

  // compute original estimated days
  const orig = steps.map((s) => ({ ...s, __origDays: parseEstimatedToDays(s.estimatedTime || s.duration || s.__days || "1") }));
  let totalOrig = orig.reduce((acc, x) => acc + (x.__origDays || 0), 0) || orig.length;

  // If more steps than days, merge until length <= availableDays
  let adjusted = orig;
  if (adjusted.length > availableDays) {
    adjusted = mergeUntilCount(adjusted, availableDays);
    totalOrig = adjusted.reduce((acc, x) => acc + (x.__origDays || 0), 0) || adjusted.length;
  }

  // scale factor (distribute availableDays proportionally)
  const scale = totalOrig > 0 ? Math.max(0.0, availableDays / totalOrig) : 1;

  // scaled days (min 1)
  let scaled = adjusted.map((s) => {
    const scaledDays = Math.max(1, Math.round((s.__origDays || 1) * scale));
    return { ...s, __scaledDays: scaledDays };
  });

  // correct rounding errors so sum(s.__scaledDays) === availableDays
  let sumScaled = scaled.reduce((a, b) => a + b.__scaledDays, 0);
  let diff = availableDays - sumScaled;
  let idx = 0;
  while (diff !== 0) {
    const pos = idx % scaled.length;
    if (diff > 0) {
      scaled[pos].__scaledDays += 1;
      diff -= 1;
    } else {
      if (scaled[pos].__scaledDays > 1) {
        scaled[pos].__scaledDays -= 1;
        diff += 1;
      }
    }
    idx++;
    if (idx > scaled.length * 10) break;
  }

  // assign dates sequentially using local-date strings (YYYY-MM-DD)
  let cursor = parseLocalDate(startInput);
  const out = [];
  for (const s of scaled) {
    const sLocal = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    // end = cursor + (days - 1)
    const endLocal = addDaysLocal(sLocal, s.__scaledDays - 1);
    out.push({
      ...s,
      startDate: s.startDate || sLocal,
      endDate: s.endDate || endLocal,
      estimatedTime: `${s.__scaledDays} days`,
    });
    // move cursor to day after endLocal
    cursor = parseLocalDate(endLocal);
    cursor.setDate(cursor.getDate() + 1);
  }

  return out;
};

/* ---------------- Topological sort utility for nodes/edges ---------------- */
const topoSortNodes = (nodes = [], edges = []) => {
  const nodeMap = new Map(nodes.map((n) => [n.id, { ...n }]));
  const indeg = new Map(nodes.map((n) => [n.id, 0]));
  const outMap = new Map(nodes.map((n) => [n.id, []]));
  for (const e of edges || []) {
    if (!indeg.has(e.to)) indeg.set(e.to, 0);
    if (!indeg.has(e.from)) indeg.set(e.from, 0);
    indeg.set(e.to, indeg.get(e.to) + 1);
    outMap.get(e.from)?.push(e.to);
  }
  const q = [];
  for (const [id, d] of indeg.entries()) {
    if (d === 0 && nodeMap.has(id)) q.push(id);
  }
  const order = [];
  while (q.length) {
    const id = q.shift();
    if (!nodeMap.has(id)) continue;
    order.push(nodeMap.get(id));
    const outs = outMap.get(id) || [];
    for (const m of outs) {
      indeg.set(m, (indeg.get(m) || 1) - 1);
      if (indeg.get(m) === 0) q.push(m);
    }
  }
  for (const n of nodes) {
    if (!order.find((o) => o.id === n.id)) order.push(n);
  }
  return order;
};

/* ---------------- Advanced proportional timeline component ---------------- */
function RoadmapVerticalFlowmap({ data = [], onNodeClick = () => {} }) {
  const containerRef = useRef(null);
  const normalized = useMemo(() => normalizeRoadmapWithDurations(data), [data]);

  const groupNames = ["frontend", "backend", "devops", "cloud", "infra", "other"];
  const keywordMap = {
    frontend: ["html", "css", "react", "tailwind", "frontend", "ui", "ux", "javascript", "dom"],
    backend: ["node", "express", "api", "postgres", "mysql", "backend", "server", "rest", "graphql"],
    devops: ["docker", "ci", "cd", "github actions", "gha", "ci/cd", "pipeline", "devops"],
    cloud: ["aws", "azure", "gcp", "s3", "ec2", "vpc", "route53", "ses"],
    infra: ["terraform", "ansible", "infrastructure", "monitor", "prometheus", "alert", "infra"],
  };

  const inferGroup = (item) => {
    if (Array.isArray(item.tags) && item.tags.length) {
      const t = item.tags.map((x) => String(x).toLowerCase());
      for (const g of groupNames) {
        if (t.includes(g)) return g;
      }
    }
    const hay = `${item.title || ""} ${item.description || ""} ${(item.rawNode && (item.rawNode.title || item.rawNode.description)) || ""}`.toLowerCase();
    for (const [g, kws] of Object.entries(keywordMap)) {
      for (const kw of kws) {
        if (hay.includes(kw)) return g;
      }
    }
    return "other";
  };

  const columns = useMemo(() => {
    const cols = {};
    groupNames.forEach((g) => (cols[g] = []));
    normalized.forEach((item, idx) => {
      const group = inferGroup(item);
      cols[group].push({ ...item, __index: idx });
    });
    return cols;
  }, [normalized]);

  const layout = useMemo(() => {
    const columnCount = groupNames.filter((g) => columns[g].length > 0).length || 1;
    const containerPadding = 40;
    const columnGap = 40;
    const columnWidth = 220;
    const totalWidth = containerPadding * 2 + columnCount * columnWidth + Math.max(0, columnCount - 1) * columnGap;
    const visibleGroups = groupNames.filter((g) => columns[g].length > 0);
    const colX = {};
    visibleGroups.forEach((g, i) => {
      colX[g] = containerPadding + i * (columnWidth + columnGap) + columnWidth / 2;
    });
    const colPositions = {};
    const topMargin = 36;
    const rowGap = 22;
    for (const g of visibleGroups) {
      const items = columns[g];
      colPositions[g] = items.map((item, i) => {
        const x = colX[g];
        const y = topMargin + i * (80 + rowGap) + 12;
        return { item, x, y };
      });
    }
    let maxY = 0;
    for (const g of visibleGroups) {
      for (const p of colPositions[g]) {
        maxY = Math.max(maxY, p.y + 56);
      }
    }
    const svgHeight = Math.max(260, maxY + 60);
    const positionsByIndex = {};
    for (const g of visibleGroups) {
      for (const p of colPositions[g]) {
        positionsByIndex[p.item.__index] = { x: p.x, y: p.y, group: g };
      }
    }
    return { visibleGroups, colX, colPositions, totalWidth, svgHeight, positionsByIndex, columnWidth };
  }, [columns, groupNames]);

  const connectors = useMemo(() => {
    const con = [];
    for (let i = 0; i < normalized.length - 1; i++) {
      const aPos = layout.positionsByIndex[i];
      const bPos = layout.positionsByIndex[i + 1];
      if (!aPos || !bPos) continue;
      const x1 = aPos.x;
      const y1 = aPos.y + 28;
      const x2 = bPos.x;
      const y2 = bPos.y - 28;
      const midY = (y1 + y2) / 2;
      const path = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
      con.push({ from: i, to: i + 1, path, x1, y1, x2, y2 });
    }
    return con;
  }, [normalized, layout]);

  const groupColor = {
    frontend: "#3b82f6",
    backend: "#10b981",
    devops: "#f59e0b",
    cloud: "#8b5cf6",
    infra: "#ef4444",
    other: "#64748b",
  };

  if (!normalized || normalized.length === 0) {
    return (
      <div className="w-full py-12 text-center text-gray-500">
        No timeline data to render — generate a roadmap first.
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto py-6" ref={containerRef}>
      <svg
        width={Math.min(layout.totalWidth, Math.max(layout.totalWidth, 900))}
        height={layout.svgHeight}
        viewBox={`0 0 ${layout.totalWidth} ${layout.svgHeight}`}
        preserveAspectRatio="xMinYMin meet"
        className="block mx-auto bg-transparent"
      >
        {layout.visibleGroups.map((g) => {
          const x = layout.colX[g];
          return (
            <g key={`lbl_${g}`}>
              <text x={x} y={18} textAnchor="middle" style={{ fontSize: 13, fill: "#475569", fontWeight: 600 }}>
                {g.toUpperCase()}
              </text>
            </g>
          );
        })}

        <g stroke="#cbd5e1" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {connectors.map((c, i) => (
            <path key={`conn_${i}`} d={c.path} strokeDasharray={i % 3 === 0 ? "6 4" : undefined} />
          ))}
        </g>

        <g>
          {normalized.map((n, idx) => {
            const pos = layout.positionsByIndex[idx];
            if (!pos) return null;
            const boxW = Math.min(200, layout.columnWidth - 12);
            const boxH = 56;
            const left = pos.x - boxW / 2;
            const top = pos.y - boxH / 2;
            const color = groupColor[pos.group] || groupColor.other;
            return (
              <g key={`node_${idx}`} transform={`translate(${left}, ${top})`} style={{ cursor: "pointer" }} onClick={() => onNodeClick(normalizeNodeForClick(n, idx), idx)}>
                <rect x={0} y={0} rx={12} width={boxW} height={boxH} fill="#ffffff" stroke="#e6eef7" strokeWidth={1.5} className="shadow-sm" />
                <rect x={8} y={8} width={10} height={10} rx={2} fill={color} />
                <text x={24} y={22} style={{ fontSize: 13, fontWeight: 700, fill: "#0f172a" }}>{n.title.length > 24 ? `${n.title.slice(0, 22)}…` : n.title}</text>
                <text x={24} y={38} style={{ fontSize: 11, fill: "#475569" }}>{n.estimatedTime || `${n.__days}d`}</text>
              </g>
            );
          })}
        </g>

        <g transform={`translate(16, ${layout.svgHeight - 28})`}>
          {Object.entries(groupColor).map(([g, c], i) => (
            <g key={`lg_${g}`} transform={`translate(${i * 140}, 0)`}>
              <rect x={0} y={-10} width={10} height={10} rx={2} fill={c} />
              <text x={16} y={-2} style={{ fontSize: 11, fill: "#475569" }}>{g}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

// Helper to ensure the node passed to onNodeClick has stable id/label
function normalizeNodeForClick(n, idx) {
  return {
    ...n,
    id: n.id || n.__label || `node-${idx}`,
    title: n.title || n.__label || `Step ${idx + 1}`,
  };
}

const RoadmapTimelineProportional = RoadmapVerticalFlowmap;

/* ---------------- Node modal ---------------- */
function NodeDetailsModal({ node, onClose, loading, error }) {
  if (!node) return null;
  const videos = (node.videos || []).slice(0, 6);
  const certs = node.certifications || node.certification || node.resources || [];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <motion.div initial={{ scale: 0.98, y: 6 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 6 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-auto shadow-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold">{node.title || node.__label}</h3>
              <div className="text-sm text-gray-500 mt-1">{node.estimatedTime || `${node.__days} days`}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-3 py-2 rounded-lg border">Close</button>
            </div>
          </div>

          <div className="mt-4 space-y-5">
            <section>
              <h4 className="font-semibold">Description</h4>
              <p className="text-sm text-gray-700 mt-2">{node.description || node.longDescription || "No description provided."}</p>
            </section>

            <section>
              <h4 className="font-semibold">Suggested videos</h4>
              {loading && !videos.length ? (
                <div className="text-sm text-gray-500 mt-2">Loading suggestions...</div>
              ) : videos.length ? (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {videos.map((v, i) => (
                    <a key={i} href={v.url || v.link || v.videoUrl} target="_blank" rel="noreferrer" className="p-3 rounded-lg border hover:shadow-sm flex flex-col">
                      <div className="text-sm font-medium truncate">{v.title || v.name || v.url}</div>
                      <div className="text-xs text-gray-500 mt-1">{v.channel || v.provider || ""}</div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 mt-2">No videos listed.</div>
              )}
            </section>

            <section>
              <h4 className="font-semibold">Certifications & resources</h4>
              {loading && !certs.length ? (
                <div className="text-sm text-gray-500 mt-2">Loading suggestions...</div>
              ) : certs.length ? (
                <ul className="mt-2 space-y-2">
                  {certs.map((c, i) => (
                    <li key={i} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium text-sm">{c.title || c.name || c.course || c.provider}</div>
                        <div className="text-xs text-gray-500">{c.provider || c.issuer || ""}</div>
                      </div>
                      {c.url ? (
                        <a className="text-xs underline" href={c.url} target="_blank" rel="noreferrer">
                          Link
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500 mt-2">No certifications listed.</div>
              )}
            </section>

            <section>
              <h4 className="font-semibold">Quick actions</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="px-3 py-2 rounded-lg bg-blue-600 text-white">Mark Completed</button>
                <button className="px-3 py-2 rounded-lg border">Add Note</button>
                <button className="px-3 py-2 rounded-lg border">Schedule</button>
                <button className="px-3 py-2 rounded-lg border">Share</button>
              </div>
            </section>

            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ---------------- Main component ---------------- */
export default function Roadmap() {
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("beginner");
  const [roadmap, setRoadmap] = useState([]); // internal array used by UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const navigate = useNavigate();
  const {id: roadmapId} = useParams();
  const { theme } = React.useContext(ThemeContext);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

  // new learner profile fields
  const [currentDomain, setCurrentDomain] = useState("");
  const [userType, setUserType] = useState("student"); // student | professional
  const [studentYear, setStudentYear] = useState(1);
  const [studentSem, setStudentSem] = useState(1);
  const [company, setCompany] = useState("");
  const [jobDomain, setJobDomain] = useState("");

  // suggestions dropdown
  const [filteredGoals, setFilteredGoals] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // refs
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const exportRef = useRef(null); // root ref used for full timeline export

  // abort controller for requests
  const abortRef = useRef({ controller: null, cancelSource: null });
  const debounceRef = useRef(null);

  // test modal
  const [showTest, setShowTest] = useState(false);
  const [answers, setAnswers] = useState({});

  // controlled expansion state — syncs chart clicks with cards
  const [expandedIndex, setExpandedIndex] = useState(null);

  // highlight + toast
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const toastTimerRef = useRef(null);

  // toast manager
  const { toasts, push, remove } = useToasts();

  // --- node details cache + loading/error (NEW) ---
  const [nodeDetailsCache, setNodeDetailsCache] = useState({}); // keyed by node id
  const [nodeDetailsLoading, setNodeDetailsLoading] = useState(false);
  const [nodeDetailsError, setNodeDetailsError] = useState(null);

  // --- dropdown & outside click ---
  useEffect(() => {
    function onDocClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
        setHighlightIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // --- debounce input for suggestions ---
  const applyFilter = useCallback((value) => {
    if (!value || !value.trim()) {
      setFilteredGoals([]);
      setShowDropdown(false);
      setHighlightIndex(-1);
      return;
    }
    const matches = SUGGESTED_GOALS.filter((s) => s.toLowerCase().includes(value.toLowerCase()));
    setFilteredGoals(matches);
    setShowDropdown(true);
    setHighlightIndex(-1);
  }, []);

  const handleInputChange = (e) => {
    const v = e.target.value;
    setGoal(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyFilter(v), 180);
  };

  const handleChevronClick = () => {
    if (showDropdown) {
      setShowDropdown(false);
      setHighlightIndex(-1);
      return;
    }
    setFilteredGoals(goal.trim() ? SUGGESTED_GOALS.filter((s) => s.toLowerCase().includes(goal.toLowerCase())) : SUGGESTED_GOALS.slice());
    setShowDropdown(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelectGoal = (g) => {
    setGoal(g);
    setFilteredGoals([]);
    setShowDropdown(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || filteredGoals.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, filteredGoals.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && filteredGoals[highlightIndex]) handleSelectGoal(filteredGoals[highlightIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightIndex(-1);
    }
  };

  const normalizeSavedToUI = (saved) => {
    // saved may be { _id, title, steps: [...] } or { roadmap: {...} } etc.
    const doc = saved?.roadmap || saved || {};
    const stepsRaw = Array.isArray(doc.steps) ? doc.steps : Array.isArray(doc.roadmap?.steps) ? doc.roadmap.steps : (Array.isArray(doc) ? doc : []);
    const norm = stepsRaw.map((s, idx) => ({
      title: s.title || s.name || `Step ${idx + 1}`,
      description: s.description || s.desc || s.summary || "",
      estimatedTime: s.estimatedTime || (s.durationDays ? `${s.durationDays} days` : s.duration) || s.__scaledDays ? `${s.__scaledDays} days` : "Varies",
      substeps: s.substeps || s.tasks || [],
      startDate: s.startDate || s.start || s.from || null,
      endDate: s.endDate || s.end || s.to || null,
      raw: s,
      level: s.level || "beginner",
    }));
    return { title: doc.title || doc.goal || "", steps: norm, meta: doc.meta || {} };
  };

  useEffect(() => {
    // if there's a roadmap id in url, fetch it and populate UI
    if (!roadmapId) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const baseURL = resolveApiBase();
        const res = await axios.get(`${baseURL}/api/roadmaps/${encodeURIComponent(roadmapId)}`, { timeout: 15000 });
        const data = res?.data || {};
        const { title, steps, meta } = normalizeSavedToUI(data);
        if (cancelled) return;
        if (title) setGoal(title);
        if (meta?.startDate) {
          setStartDateInput(meta.startDate.slice(0,10));
          // if meta has totalDays or endDate prefer them
          if (meta.endDate) setEndDateInput(meta.endDate.slice(0,10));
        }
        // populate roadmap state with normalized steps (UI expects array of steps)
        setRoadmap(steps);
        push("Loaded saved roadmap", TOAST_TYPES.SUCCESS);
      } catch (err) {
        console.error("Failed to load saved roadmap", err);
        push("Failed to load saved roadmap. It may be private or deleted.", TOAST_TYPES.ERROR);
        setError("Failed to load saved roadmap");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [roadmapId]);

  // --- Test modal helpers ---
  const questions = [
    { id: 1, question: "How comfortable are you with fundamental concepts in this field?", options: ["Not at all", "Somewhat", "Very comfortable"] },
    { id: 2, question: "How much hands-on experience do you have?", options: ["None", "Some small projects", "Extensive experience"] },
    { id: 3, question: "Can you work independently on tasks related to this goal?", options: ["Not yet", "With some guidance", "Yes, easily"] },
  ];

  const handleAnswer = (qid, opt) => setAnswers((prev) => ({ ...prev, [qid]: opt }));

  const calculateLevel = () => {
    const vals = Object.values(answers);
    const score = vals.reduce((acc, a) => {
      if (!a) return acc;
      if (a === "Not at all" || a === "None" || a === "Not yet") return acc + 0;
      if (a === "Somewhat" || a === "Some small projects" || a === "With some guidance") return acc + 1;
      return acc + 2;
    }, 0);
    if (score <= 2) return "beginner";
    if (score <= 4) return "intermediate";
    return "expert";
  };

  const submitTest = () => {
    setLevel(calculateLevel());
    setShowTest(false);
    push(`Skill level set to ${calculateLevel()}`, TOAST_TYPES.SUCCESS);
  };

  const startTest = () => {
    if (!goal.trim()) {
      push("Please enter a career goal first.", TOAST_TYPES.ERROR);
      return;
    }
    setError("");
    setAnswers({});
    setShowTest(true);
  };

  // place this inside component: resolveApiBase
  function resolveApiBase() {
    try {
      if (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE) {
        return process.env.REACT_APP_API_BASE;
      }
      if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) {
        return import.meta.env.VITE_API_BASE;
      }
      if (typeof window !== "undefined" && window.__API_BASE__) {
        return window.__API_BASE__;
      }
      return "http://localhost:5000";
    } catch (err) {
      console.warn("⚠️ Could not resolve API base, using default localhost:", err);
      return "http://localhost:5000";
    }
  }

  // --- generate roadmap (supports new meta/nodes/edges shape) ---
  const handleGenerate = async ({ force = false } = {}) => {
    if (!goal.trim()) {
      push("Please enter a career goal.", TOAST_TYPES.ERROR);
      return;
    }

    if (!currentDomain.trim()) {
      push("Please enter your current work/study domain.", TOAST_TYPES.ERROR);
      return;
    }
    if (userType === "student" && (!studentYear || studentYear <= 0)) {
      push("Please enter your academic year.", TOAST_TYPES.ERROR);
      return;
    }
    if (userType === "professional" && !jobDomain.trim()) {
      push("Please enter your job domain.", TOAST_TYPES.ERROR);
      return;
    }

    // Keep date-only strings (YYYY-MM-DD) — parseLocalDate will treat these as local dates
    const resolvedStart = startDateInput ? startDateInput : null;
    const resolvedEnd = endDateInput ? endDateInput : null;

    if (!resolvedStart || !resolvedEnd) {
      push("Please enter both Start date and End date for the learning plan.", TOAST_TYPES.ERROR);
      return;
    }

    const availableDays = daysBetweenInclusive(resolvedStart, resolvedEnd);
    if (availableDays === null) {
      push("Invalid date range — please check start/end dates.", TOAST_TYPES.ERROR);
      return;
    }
    if (availableDays <= 0) {
      push("End date must be the same as or after the Start date.", TOAST_TYPES.ERROR);
      return;
    }

    setError("");
    setLoading(true);
    setRoadmap([]);
    setExpandedIndex(null);

    try {
      if (abortRef.current.controller) abortRef.current.controller.abort();
      if (abortRef.current.cancelSource) abortRef.current.cancelSource.cancel("new-request");
    } catch (e) {}

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const cancelSource = axios.CancelToken ? axios.CancelToken.source() : null;
    abortRef.current = { controller, cancelSource };

    try {
      const baseURL = resolveApiBase();
      const url = `${baseURL}/api/roadmaps/generate`;

      const instructions = `
  You are an assistant that returns a structured TIMELINE JSON array for a learner pursuing the career goal below.
  Return a JSON array (no additional text) where each item is an object with these fields:
  - title (string)
  - description (string, concise)
  - startDate (ISO date string)
  - endDate (ISO date string)
  - estimatedTime (human-friendly)
  - substeps (array of strings)
  Return at least 10 steps that form a progressive timeline (foundational -> intermediate -> advanced). Prioritize realistic durations.
  Do NOT include explanatory text outside the JSON array.
  `;

      const learnerProfile = {
        currentDomain,
        userType,
        student: userType === "student" ? { year: studentYear, sem: studentSem } : null,
        professional: userType === "professional" ? { company: company || null, jobDomain: jobDomain || null } : null,
      };

      const options = { minSteps: 10, format: "timeline", includeDates: true, startDate: resolvedStart, endDate: resolvedEnd };

      const payload = { career: goal, level, instructions, options, learnerProfile };

      const axiosConfig = { timeout: 60000 };
      if (controller) axiosConfig.signal = controller.signal;
      if (cancelSource) axiosConfig.cancelToken = cancelSource.token;

      const res = await axios.post(url, payload, axiosConfig);

      if (res?.data?.nodes && res?.data?.edges) {
        const meta = res.data.meta || {};
        const nodes = res.data.nodes || [];
        const edges = res.data.edges || [];

        const ordered = topoSortNodes(nodes, edges);

        const mapped = ordered.map((n, idx) => {
          const est = n.durationDays || n.duration || n.estimatedTime || (n.__days ? `${n.__days} days` : null);
          const days = n.durationDays || n.__days || (est ? parseEstimatedToDays(est) : null);
          let startDate = n.startOffsetDays != null && meta?.startDate ? (() => {
            const d = new Date(meta.startDate);
            d.setDate(d.getDate() + (n.startOffsetDays || 0));
            return d.toISOString();
          })() : (n.startDate || n.start || null);
          let endDate = n.endOffsetDays != null && meta?.startDate ? (() => {
            const d = new Date(meta.startDate);
            d.setDate(d.getDate() + (n.endOffsetDays || (n.startOffsetDays || 0) + (days || 7)));
            return d.toISOString();
          })() : (n.endDate || n.end || null);

          return {
            title: n.title || n.id || `Step ${idx + 1}`,
            description: n.description || n.subtitle || n.summary || "",
            estimatedTime: est || (days ? `${days} days` : "Varies"),
            substeps: n.substeps || n.tasks || [],
            startDate,
            endDate,
            rawNode: n,
            type: n.type || "topic",
            resources: n.resources || n.links || [],
            tags: n.tags || [],
            level: n.level || level,
          };
        });

        if (mapped.length < 10 && !force) {
          push(`Server returned ${mapped.length} nodes (less than 10). You can regenerate to try for 10+ nodes.`, TOAST_TYPES.INFO, { duration: 7000 });
        }

        const finalMapped = (resolvedStart && resolvedEnd) ? assignDatesToSteps(mapped, resolvedStart, resolvedEnd) : mapped;

        setRoadmap(finalMapped);
        push(`Roadmap generated with ${finalMapped.length} nodes (from nodes/edges).`, TOAST_TYPES.SUCCESS);
        setLoading(false);
        return;
      }

      const steps = res.data?.roadmap || res.data?.steps || (Array.isArray(res.data) ? res.data : null);

      if (!Array.isArray(steps) || steps.length === 0) {
        push(res.data?.message || "No roadmap steps returned. Try a different goal or try again later.", TOAST_TYPES.ERROR);
        setRoadmap([]);
      } else {
        const normalized = steps.map((s, i) => ({
          title: s.title || s.phase || s.name || `Step ${i + 1}`,
          description: s.description || s.desc || s.summary || s.text || "No description provided.",
          estimatedTime: s.estimatedTime || s.duration || s.time || s.eta || "Unspecified",
          substeps: s.substeps || s.tasks || [],
          startDate: s.startDate || s.start || s.from || null,
          endDate: s.endDate || s.end || s.to || null,
          level: s.level || level,
          raw: s,
        }));

        if (normalized.length < 10 && !force) {
          push(`Server returned ${normalized.length} steps (less than 10). You can regenerate to try for 10+ steps.`, TOAST_TYPES.INFO, { duration: 7000 });
        }

        const finalSteps = (resolvedStart && resolvedEnd) ? assignDatesToSteps(normalized, resolvedStart, resolvedEnd) : normalized;

        setRoadmap(finalSteps);
        push(`Roadmap generated with ${finalSteps.length} steps.`, TOAST_TYPES.SUCCESS);
      }
    } catch (err) {
      if (axios.isCancel && axios.isCancel(err)) {
        console.log("Request canceled");
      } else if (err.name === "CanceledError") {
        console.log("Request canceled (fetch-like)");
      } else if (err.code === "ECONNABORTED") {
        push("Request timed out. Try again.", TOAST_TYPES.ERROR);
      } else {
        const message = err?.response?.data?.message || err?.message || "Failed to generate roadmap. Please try again.";
        push(message, TOAST_TYPES.ERROR);
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      try {
        if (abortRef.current.controller) abortRef.current.controller.abort();
        if (abortRef.current.cancelSource) abortRef.current.cancelSource.cancel("unmount");
      } catch (e) {}
    };
  }, []);

  // --- node details fetcher (NEW) ---
  const fetchNodeDetails = useCallback(
    async (node) => {
      if (!node) return null;
      const id = node.id || (node.rawNode && node.rawNode.id) || node.__label || `${node.title}`.slice(0, 60);
      if (nodeDetailsCache[id]) return nodeDetailsCache[id];

      setNodeDetailsLoading(true);
      setNodeDetailsError(null);
      try {
        const baseURL = resolveApiBase();
        // Attempt to GET real details from backend. Backend endpoint should return { videos, certifications, resources }
        const res = await axios.get(`${baseURL}/api/roadmaps/nodes/${encodeURIComponent(id)}`, { timeout: 15000 }).catch(() => null);

        let details = res?.data || null;

        // If backend returned nothing, provide friendly placeholders (so modal doesn't feel empty)
        if (!details || (Array.isArray(details.videos) && details.videos.length === 0 && Array.isArray(details.certifications) && details.certifications.length === 0)) {
          // Placeholder minimal suggestions — replace with server-generated suggestions later
          details = {
            videos: [
              { title: `${node.title} — Intro (placeholder)`, url: "https://www.youtube.com", channel: "YouTube" },
            ],
            certifications: [
              { title: `${node.title} Fundamentals (placeholder)`, provider: "Coursera", url: "https://www.coursera.org" },
            ],
            resources: [
              { title: "MDN Reference", url: "https://developer.mozilla.org/" },
            ],
          };
        }

        const merged = { ...node, ...details };
        setNodeDetailsCache((s) => ({ ...s, [id]: merged }));
        return merged;
      } catch (err) {
        console.warn("Could not fetch node details", err);
        setNodeDetailsError("Could not load suggestions for this item.");
        return node;
      } finally {
        setNodeDetailsLoading(false);
      }
    },
    [nodeDetailsCache]
  );

  // --- share & save helpers (save returns publicId optionally) ---
  const handleShare = async () => {
    if (!roadmap || roadmap.length === 0) {
      push("Generate a roadmap first to share it.", TOAST_TYPES.ERROR);
      return;
    }
    const payload = { title: `Roadmap: ${goal}`, roadmap };
    if (navigator.share) {
      try {
        await navigator.share({ title: `Roadmap — ${goal}`, text: `Here's my roadmap for ${goal}.`, url: window.location.href });
        push("Shared via native share.", TOAST_TYPES.SUCCESS);
      } catch (e) {
        console.log("Share cancelled or failed", e);
        push("Share cancelled.", TOAST_TYPES.INFO);
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      push("Roadmap copied to clipboard (JSON).", TOAST_TYPES.SUCCESS);
    } catch (e) {
      push("Unable to copy to clipboard. Please select and copy manually.", TOAST_TYPES.ERROR);
    }
  };

  // 🔒 Helper: get Authorization header (Bearer token or none)
  function getAuthHeaders() {
    const token =
      typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;

    const headers = { "Content-Type": "application/json" };

    if (token && token.trim() !== "") {
      headers.Authorization = `Bearer ${token}`;
    }

    return { headers, hasToken: !!token };
  }

  // 🧩 Replace your existing handleSave with this version
  const handleSave = async () => {
    try {
      if (!roadmap || roadmap.length === 0) {
        push("Generate a roadmap first to save it.", TOAST_TYPES.ERROR);
        return;
      }

      // Infer user ID (optional)
      const inferredUserId =
        (typeof window !== "undefined" && window.__USER_ID__) ||
        (typeof localStorage !== "undefined" && localStorage.getItem("userId")) ||
        null;

      // 🧠 Get token headers
      const { headers, hasToken } = getAuthHeaders();

      if (!hasToken) {
        push(
          "You must be logged in to save your roadmap.",
          TOAST_TYPES.ERROR,
          { duration: 4000 }
        );
        return;
      }

      const normalizedSteps = roadmap.map((s, idx) => {
        const toDateStr = (v) => {
          if (!v) return null;
          if (v instanceof Date && !isNaN(v)) {
            const y = v.getFullYear();
            const m = String(v.getMonth() + 1).padStart(2, "0");
            const d = String(v.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
          }
          const sStr = String(v);
          const match = sStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (match) return `${match[1]}-${match[2]}-${match[3]}`;
          const parsed = new Date(sStr);
          if (!isNaN(parsed)) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, "0");
            const d = String(parsed.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
          }
          return null;
        };

        return {
          title: s.title || `Step ${idx + 1}`,
          description: s.description || "",
          startDate: toDateStr(s.startDate) || undefined,
          endDate: toDateStr(s.endDate) || undefined,
          durationDays: s.__scaledDays || s.durationDays || undefined,
          order: typeof s.__index === "number" ? s.__index : idx,
          dependencies: Array.isArray(s.dependencies)
            ? s.dependencies
            : undefined,
        };
      });

      const payload = {
        userId: inferredUserId,
        goal:
          goal ||
          (typeof window !== "undefined" && window.__DEFAULT_GOAL__) ||
          "Untitled Roadmap",
        steps: normalizedSteps,
        meta: {
          domain: currentDomain || null,
          roleType: userType || null,
          studentYear: userType === "student" ? studentYear : undefined,
          company: userType === "professional" ? company : undefined,
          jobDomain: userType === "professional" ? jobDomain : undefined,
        },
      };

      push("Saving roadmap...", TOAST_TYPES.INFO, {
        persistent: true,
        id: "saving",
      });

      const baseURL = resolveApiBase();

      const res = await axios.post(`${baseURL}/api/roadmaps/save`, payload, {
        timeout: 30000,
        withCredentials: true, // keep for cookie-based sessions
        headers,
      });

      remove("saving");

      if (res.status === 201 || res.status === 200) {
        push("Roadmap saved successfully.", TOAST_TYPES.SUCCESS);

        const saved = res.data?.roadmap || res.data;
        const savedId =
          (saved && (saved._id || saved.id)) ||
          res.data?.id ||
          res.data?.publicId ||
          null;

        if (savedId) {
          try {
            navigate(`/dashboard/roadmaps/${savedId}`);
          } catch {
            window.location.href = `/dashboard/roadmaps/${savedId}`;
          }
        } else {
          navigate("/dashboard");
        }
      } else {
        push(
          res.data?.message || "Save completed (check server response).",
          TOAST_TYPES.INFO
        );
      }
    } catch (err) {
      console.error("handleSave error:", err);
      remove("saving");

      if (err?.response?.status === 401) {
        push(
          "Unauthorized: please log in again before saving.",
          TOAST_TYPES.ERROR,
          { duration: 4000 }
        );
        return;
      }

      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Save failed.";
      push(msg, TOAST_TYPES.ERROR);
    }
  };




  // Chart point click handler
  const onChartPointClick = (index) => {
    if (typeof index !== "number") return;
    setExpandedIndex((prev) => (prev === index ? null : index));
    setHighlightedIndex(index);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setHighlightedIndex(null), 1200);
    setTimeout(() => {
      const el = document.querySelector(`#roadmap-item-${index}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    push(`Opened phase ${index + 1}`, TOAST_TYPES.INFO);
  };

  // Timeline Edit handler
  const handleEditNode = (node, idx) => {
    const index = typeof idx === "number" ? idx : roadmap.findIndex((r) => (r.title && node.title && r.title === node.title) || (r.startDate && node.startDate && r.startDate === node.startDate));
    if (index !== -1) {
      setExpandedIndex(index);
      setHighlightedIndex(index);
      setTimeout(() => {
        const el = document.querySelector(`#roadmap-item-${index}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
      push(`Opened phase ${index + 1} for edit`, TOAST_TYPES.INFO);
    } else {
      push("Opened item (preview) — step not matched for edit.", TOAST_TYPES.INFO);
    }
  };

  // Export helpers
  const exportElementAsPNG = async (selectorOrNode, filename = "roadmap.png") => {
    try {
      const node = typeof selectorOrNode === "string" ? document.querySelector(selectorOrNode) : selectorOrNode;
      if (!node) throw new Error("Export target not found");
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const canvas = await html2canvas(node, { useCORS: true, scale: Math.min(2, window.devicePixelRatio || 1) });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.click();
      push("PNG exported.", TOAST_TYPES.SUCCESS);
    } catch (e) {
      console.error(e);
      push("Export failed. See console for details.", TOAST_TYPES.ERROR);
    }
  };

  const exportTimelineAsPDF = async (selectorOrNode, filename = "roadmap.pdf") => {
    try {
      const node = typeof selectorOrNode === "string" ? document.querySelector(selectorOrNode) : selectorOrNode;
      if (!node) throw new Error("Export target not found");
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const canvas = await html2canvas(node, { useCORS: true, scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? "landscape" : "portrait" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
      const imgW = imgProps.width * ratio;
      const imgH = imgProps.height * ratio;
      pdf.addImage(imgData, "PNG", (pdfWidth - imgW) / 2, 10, imgW, imgH);
      pdf.save(filename);
      push("PDF exported.", TOAST_TYPES.SUCCESS);
    } catch (e) {
      console.error(e);
      push("PDF export failed. See console for details.", TOAST_TYPES.ERROR);
    }
  };

  // UI render
  return (
    <>
      <Toasts toasts={toasts} onRemove={remove} />

      <LoadingOverlay visible={loading} />

      <div ref={exportRef} className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center px-4 py-10">
        <div className="max-w-4xl w-full space-y-8">
          <h1 className="text-3xl font-bold text-center">🎯 AI Career Roadmap Generator</h1>
          <p className="text-center text-gray-600 dark:text-gray-400">Enter your goal, take a short assessment to set your level, then generate a personalized timeline (10+ steps).</p>

          <div className="space-y-4">
            <div ref={wrapperRef} className={`relative flex items-center gap-3 border rounded-xl px-3 transition-shadow duration-300 focus-within:ring-2 focus-within:ring-blue-500 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}>
              <input ref={inputRef} aria-label="Career goal" aria-haspopup="listbox" aria-expanded={showDropdown} type="text" placeholder="Search or type your goal..." value={goal} onChange={handleInputChange} onKeyDown={handleKeyDown} className={`flex-1 w-full py-3 bg-transparent focus:outline-none ${theme === "dark" ? "text-gray-100 placeholder-gray-400" : "text-gray-900 placeholder-gray-500"}`} />
              <ChevronDown onClick={handleChevronClick} className={`ml-2 w-5 h-5 text-gray-400 cursor-pointer transition-transform ${showDropdown ? "rotate-180" : "rotate-0"}`} aria-hidden />
              {showDropdown && (
                <div className={`absolute left-0 right-0 top-full mt-2 z-50 rounded-lg shadow-xl max-h-48 overflow-y-auto border focus:outline-none ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`} role="listbox">
                  {filteredGoals.length === 0 ? <div className="px-4 py-2 text-gray-500">No suggestions</div> : filteredGoals.map((g, i) => (
                    <div id={`suggest-${i}`} key={`${g}-${i}`} role="option" aria-selected={highlightIndex === i} onMouseDown={(e) => { e.preventDefault(); handleSelectGoal(g); }} onMouseEnter={() => setHighlightIndex(i)} className={`px-4 py-2 cursor-pointer transition flex items-center gap-2 ${highlightIndex === i ? "bg-blue-600 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}>{g}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex-1 w-full relative">
                <select value={level} onChange={(e) => setLevel(e.target.value)} className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 appearance-none bg-no-repeat cursor-pointer ${theme === "dark" ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`} aria-label="Skill level" style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 1rem center", backgroundSize: "1.25em" }} aria-describedby="level-badge">
                  <option value="beginner">Beginner (Just starting out)</option>
                  <option value="intermediate">Intermediate (Some experience)</option>
                  <option value="expert">Expert (Strong foundation)</option>
                </select>
                <div className="absolute right-3 top-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${level === "beginner" ? "bg-green-100 text-green-800" : level === "intermediate" ? "bg-amber-100 text-amber-800" : "bg-violet-100 text-violet-800"}`}>{level[0].toUpperCase() + level.slice(1)}</span>
                </div>
              </div>

              <button type="button" onClick={() => { if (!goal.trim()) { push("Please enter a career goal first.", TOAST_TYPES.ERROR); return; } setError(""); navigate(`/test/${encodeURIComponent(goal)}`); }} className="w-full sm:w-auto shrink-0 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity duration-300 cursor-pointer">Take AI Test</button>
            </div>

            {/* NEW: Learner profile inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-sm mb-1">Current domain</label>
                <input value={currentDomain} onChange={(e) => setCurrentDomain(e.target.value)} placeholder="e.g. Computer Science, Marketing" className="w-full px-3 py-2 rounded-xl border" aria-label="Current domain" />
                <p className="text-xs text-gray-500 mt-1">What are you currently studying or working in?</p>
              </div>

              <div className="col-span-1">
                <label className="block text-sm mb-1">Start date</label>
                <input
                  type="date"
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border"
                  aria-label="Start date"
                />
                <p className="text-xs text-gray-500 mt-1">When do you want to start?</p>
              </div>

              <div className="col-span-1">
                <label className="block text-sm mb-1">End date</label>
                <input
                  type="date"
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border"
                  aria-label="End date"
                />
                <p className="text-xs text-gray-500 mt-1">Target end date for the full plan.</p>
              </div>

              <div className="col-span-1">
                <label className="block text-sm mb-1">Are you a student or professional?</label>
                <div className="flex gap-2">
                  <button onClick={() => setUserType('student')} className={`px-3 py-2 rounded-xl border ${userType === 'student' ? 'bg-blue-600 text-white' : ''}`}>Student</button>
                  <button onClick={() => setUserType('professional')} className={`px-3 py-2 rounded-xl border ${userType === 'professional' ? 'bg-blue-600 text-white' : ''}`}>Working Professional</button>
                </div>
                <div className="text-xs text-gray-500 mt-1">This helps tailor timeline to your context.</div>
              </div>
            </div>

            {userType === 'student' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Academic year</label>
                  <input type="number" min="1" value={studentYear} onChange={(e) => setStudentYear(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border" aria-label="Academic year" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Semester</label>
                  <input type="number" min="1" value={studentSem} onChange={(e) => setStudentSem(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border" aria-label="Semester" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Company (optional)</label>
                  <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp" className="w-full px-3 py-2 rounded-xl border" aria-label="Company" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Job domain</label>
                  <input value={jobDomain} onChange={(e) => setJobDomain(e.target.value)} placeholder="e.g. Backend Engineering" className="w-full px-3 py-2 rounded-xl border" aria-label="Job domain" />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => handleGenerate()} disabled={loading} className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed">{loading ? (<div className="flex items-center justify-center gap-2"><Loader2 className="animate-spin w-5 h-5" /> Generating...</div>) : (<><Loader2 className="w-4 h-4 inline mr-2" /> Generate Roadmap <ArrowRight className="inline ml-2" /></>)}</button>

              <button onClick={handleShare} title="Share roadmap" className="px-4 py-3 rounded-xl border flex items-center gap-2"><Share2 className="w-4 h-4" /> Share</button>

              <div className="relative">
                <button onClick={handleSave} title="Save roadmap (backend required)" className="px-4 py-3 rounded-xl border flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
              </div>

              <button onClick={() => { exportElementAsPNG('.timeline-root', 'roadmap-chart.png'); }} title="Export chart PNG" className="px-4 py-3 rounded-xl border flex items-center gap-2"><Download className="w-4 h-4" /> PNG</button>

              <button onClick={() => {
                if (exportRef.current) {
                  exportTimelineAsPDF(exportRef.current, 'roadmap.pdf');
                } else {
                  exportTimelineAsPDF('.timeline-root', 'roadmap.pdf');
                }
              }} title="Export full timeline PDF" className="px-4 py-3 rounded-xl border flex items-center gap-2"><Download className="w-4 h-4" /> PDF</button>

              <button onClick={() => { if (!roadmap.length) { push('No roadmap to regenerate.', TOAST_TYPES.INFO); return; } handleGenerate({ force: true }); }} title="Regenerate timeline" className="px-4 py-3 rounded-xl border flex items-center gap-2"><Repeat className="w-4 h-4" /> Regenerate</button>

            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}
          </div>

          {/* Roadmap timeline + chart */}
          <div className="mt-6 timeline-root">
            {roadmap.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">No roadmap yet — generate one to get started.</div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-center">🗺️ Your Roadmap for {goal}</h2>

                {/* Proportional Timeline (new) */}
                <div className="mt-4">
                  <RoadmapTimelineProportional
                    data={roadmap}
                    onNodeClick={async (node, idx) => {
                      // fetch details then open modal
                      const detailed = await fetchNodeDetails(node);
                      setSelectedNode(detailed);
                      handleEditNode(detailed, idx);
                    }}
                  />
                </div>

                {/* Node details modal */}
                <NodeDetailsModal node={selectedNode} onClose={() => setSelectedNode(null)} loading={nodeDetailsLoading} error={nodeDetailsError} />

                {/* Detailed timeline (cards) */}
                <div className="mt-6 space-y-4">
                  <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}>
                    {roadmap.map((s, idx) => (
                      <motion.div key={idx} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                        <div id={`roadmap-item-${idx}`} className={`transition-all ${highlightedIndex === idx ? "animate-pulse" : ""}`}>
                          <RoadmapItem step={s} defaultCollapsed={idx > 0} isOpen={expandedIndex === idx} onToggle={(nextOpen) => setExpandedIndex(nextOpen ? idx : null)} highlighted={highlightedIndex === idx} />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline Test Modal */}
      <AnimatePresence>
        {showTest && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg mx-4" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <h3 className="text-lg font-semibold mb-4 text-center">🧠 Quick Skill Assessment</h3>
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id}>
                    <p className="font-medium mb-2">{q.question}</p>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => (
                        <button key={opt} onClick={() => handleAnswer(q.id, opt)} className={`px-3 py-2 rounded-lg border transition cursor-pointer ${answers[q.id] === opt ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{opt}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setShowTest(false)} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 cursor-pointer">Cancel</button>
                <button onClick={submitTest} className="px-4 py-2 rounded-md bg-blue-600 text-white cursor-pointer">Submit Test</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
