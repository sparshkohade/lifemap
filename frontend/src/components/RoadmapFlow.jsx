// src/components/RoadmapFlow.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

// small custom node for nicer look (you can reuse your TopicNode)
const TopicNode = ({ data }) => {
  const { title, subtitle, progress, tags, visual } = data;
  return (
    <div style={{
      padding: 12,
      display: "flex",
      gap: 10,
      alignItems: "center",
      background: visual?.color ?? "#ffffff",
      borderRadius: 12,
      boxShadow: "0 6px 18px rgba(2,6,23,0.06)",
      minWidth: 240,
      maxWidth: 340
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 44, background: "#fff", border: "2px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 30, height: 30, borderRadius: 30, border: "3px solid #10b981", transform: "rotate(-90deg)" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{subtitle}</div>}
        {tags && <div style={{ display: "flex", gap: 6, marginTop: 8 }}>{tags.slice(0,3).map(t => <span key={t} style={{ fontSize: 11, background: "#f1f5f9", padding: "4px 8px", borderRadius: 8 }}>{t}</span>)}</div>}
      </div>
    </div>
  );
};

const CheckpointNode = ({ data }) => (
  <div style={{
    padding: "12px 16px",
    background: "#111827",
    color: "#fff",
    borderRadius: 12,
    minWidth: 220,
    textAlign: "center",
    fontWeight: 700
  }}>{data.title}</div>
);

const nodeTypes = { topic: TopicNode, checkpoint: CheckpointNode, group: TopicNode };

// Dagre settings
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const NODE_WIDTH = 300;
const NODE_HEIGHT = 90;

/** compute dagre layout */
function layoutNodesAndEdges(nodes, edges, direction = "LR", gapX = 120, gapY = 60) {
  dagreGraph.setGraph({ rankdir: direction, nodesep: gapX, ranksep: gapY });

  nodes.forEach(n => dagreGraph.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach(e => dagreGraph.setEdge(e.source, e.target));

  try {
    dagre.layout(dagreGraph);
  } catch (err) {
    // fallback: do nothing if dagre fails
    console.warn("dagre layout failed", err);
  }

  const layouted = nodes.map(node => {
    const n = dagreGraph.node(node.id);
    if (!n) return node;
    return {
      ...node,
      position: { x: n.x - NODE_WIDTH / 2, y: n.y - NODE_HEIGHT / 2 },
      data: { ...node.data }
    };
  });

  return { nodes: layouted, edges };
}

export default function RoadmapFlow({ flowJson = { nodes: [], edges: [] }, direction = "LR", onNodeSelect = () => {} }) {
  // normalize incoming nodes / edges
  const nodesFromJson = useMemo(() => flowJson.nodes.map(n => ({
    id: n.id,
    type: n.type === "checkpoint" ? "checkpoint" : (n.type === "group" ? "group" : "topic"),
    data: {
      title: n.title,
      subtitle: n.subtitle,
      progress: n.progress || 0,
      tags: n.tags || [],
      visual: n.visual || {},
      raw: n
    },
    position: { x: 0, y: 0 },
  })), [flowJson.nodes]);

  const edgesFromJson = useMemo(() => flowJson.edges.map((e, i) => ({
    id: `e-${e.from}-${e.to}-${i}`,
    source: e.from,
    target: e.to,
    data: { label: e.label || "" },
    animated: e.type === "solid",
    style: { stroke: e.type === "dashed" ? "rgba(0,0,0,0.18)" : "#CBD5E1", strokeDasharray: e.type === "dashed" ? "6,6" : undefined },
    markerEnd: { type: MarkerType.ArrowClosed }
  })), [flowJson.edges]);

  // compute layout
  const layouted = useMemo(() => layoutNodesAndEdges(nodesFromJson, edgesFromJson, direction, 150, 80), [nodesFromJson, edgesFromJson, direction]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layouted.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layouted.edges || []);

  // sync when flowJson changes
  useEffect(() => {
    if (layouted.nodes && layouted.nodes.length) setNodes(layouted.nodes);
    if (layouted.edges && layouted.edges.length) setEdges(layouted.edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowJson]);

  const onNodeClick = useCallback((evt, node) => {
    // call parent callback (open modal, etc.)
    onNodeSelect(node.data.raw);
  }, [onNodeSelect]);

  const onConnect = useCallback(connection => setEdges(es => addEdge(connection, es)), [setEdges]);

  return (
    <div style={{ width: "100%", height: 520, borderRadius: 12, background: "#fff", padding: 12, boxSizing: "border-box" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.25}
        maxZoom={2}
        panOnScroll
        zoomOnScroll
        onNodeClick={onNodeClick}
      >
        <Background gap={20} color="#f8fafc" />
        <Controls showInteractive={false} />
        <MiniMap nodeColor={(n) => (n.data?.raw?.type === "checkpoint" ? "#111827" : "#60a5fa")} />
      </ReactFlow>
    </div>
  );
}
