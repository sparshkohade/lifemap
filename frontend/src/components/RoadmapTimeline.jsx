// src/components/RoadmapTimeline.jsx
import React from "react";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { CheckCircle } from "lucide-react";

export default function RoadmapTimeline({ steps }) {
  if (!steps || steps.length === 0) return null;

  return (
    <VerticalTimeline>
      {steps.map((step, index) => (
        <VerticalTimelineElement
          key={index}
          contentStyle={{
            background: "#f0f4f8",
            color: "#111827",
          }}
          contentArrowStyle={{ borderRight: "7px solid  #f0f4f8" }}
          date={step.estimatedTime || ""}
          iconStyle={{ background: "#2563EB", color: "#fff" }}
          icon={<CheckCircle />}
        >
          <h3 className="text-lg font-semibold">{step.title}</h3>
          <p className="text-gray-700">{step.description}</p>
        </VerticalTimelineElement>
      ))}
    </VerticalTimeline>
  );
}
