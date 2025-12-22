// src/components/segments/SegmentTimeline.jsx
import React from "react";
import { FaSubway, FaWalking, FaBus } from "react-icons/fa";

const ROUTE_COLORS = {
    RED: "#D32F2F",
    BLUE: "#1976D2",
    GREEN: "#388E3C",
    YELLOW: "#FBC02D",
    VIOLET: "#7B1FA2",
    ORANGE: "#FB8C00",
    MAGENTA: "#C2185B",
    AQUA: "#0097A7",
    GRAY: "#9E9E9E",
};

export default function SegmentTimeline({ segments = [], onSegmentClick = () => { } }) {
    if (!segments.length) return null;

    // compute total length (for visual proportion) — fallback if distance not given: use 1 per seg
    const totals = segments.map(s => s.distance_meters || 1);
    const total = totals.reduce((a, b) => a + b, 0);

    return (
        <div style={{ padding: 12, background: "#fff", borderRadius: 10, boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 13, color: "#444", fontWeight: 700, marginBottom: 8 }}>Trip segments</div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", overflowX: "auto", paddingBottom: 6 }}>
                {segments.map((seg, i) => {
                    const wPct = Math.max(6, Math.round(((seg.distance_meters || 1) / total) * 100)); // min width
                    const color = ROUTE_COLORS[(seg.route_color || seg.route || "").toString().toUpperCase()] || (seg.mode === "walk" ? "#ddd" : "#888");
                    const Icon = seg.mode === "metro" ? FaSubway : seg.mode === "walk" ? FaWalking : FaBus;

                    return (
                        <div key={i} style={{ minWidth: `${wPct}px`, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }} onClick={() => onSegmentClick(seg, i)}>
                            <div style={{ width: Math.max(36, wPct), height: 12, background: color, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Icon style={{ color: "#fff", width: 12, height: 12 }} />
                            </div>
                            <div style={{ fontSize: 11, color: "#666", marginTop: 6, textAlign: "center", maxWidth: Math.max(40, wPct) }}>
                                {seg.mode === "walk" ? `Walk ${seg.distance_meters ? Math.round(seg.distance_meters) + 'm' : ''}` : seg.route_name || seg.route || seg.mode}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
