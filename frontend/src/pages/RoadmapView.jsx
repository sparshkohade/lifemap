// src/pages/RoadmapView.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../utils/api";

export default function RoadmapView() {
  const { id } = useParams();
  const [roadmap, setRoadmap] = useState(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await API.get(`/roadmaps/${id}`);
        setRoadmap(data);
      } catch (e) {
        console.error("Failed to load roadmap", e);
      }
    })();
  }, [id]);

  if (!roadmap) return <div>Loading roadmap...</div>;
  return (
    <div>
      <h1>{roadmap.title}</h1>
      {/* render roadmap content */}
    </div>
  );
}
