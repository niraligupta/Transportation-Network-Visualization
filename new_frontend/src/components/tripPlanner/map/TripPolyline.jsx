// src/components/map/TripPolyline.jsx
import React from "react";
import { Polyline, Tooltip } from "react-leaflet";
import { FaSubway, FaBus, FaWalking } from "react-icons/fa";

const ROUTE_COLORS = {
    RED: "#D32F2F",
    BLUE: "#1976D2",
    GREEN: "#388E3C",
    YELLOW: "#FBC02D",
    VIOLET: "#7B1FA2",
    ORANGE: "#FB8C00",
    MAGENTA: "#B71C1C",
    AQUA: "#00ACC1",
    GRAY: "#9E9E9E",
};

export default function TripPolyline({ segments }) {
    if (!segments || !segments.length) return null;

    // compute start/end for start->destination connector
    const start = segments[0]?.shape?.[0];
    const lastSeg = segments[segments.length - 1];
    const end = lastSeg?.shape?.slice(-1)?.[0];

    return (
        <>
            {segments.map((seg, i) => {
                const keyColorName = (seg.route_color || seg.route || "").toString().toUpperCase();
                const color = ROUTE_COLORS[keyColorName] || (seg.mode === "walk" ? "#777" : "#666");

                const pathOptions = {
                    color,
                    weight: seg.mode === "metro" ? 6 : seg.mode === "bus" ? 5 : 3,
                    opacity: 0.95,
                    dashArray: seg.mode === "walk" ? "6 8" : null,
                    lineCap: "round",
                };

                const tooltipText =
                    seg.mode === "walk"
                        ? `Walk • ${seg.distance_meters || 0} m`
                        : seg.mode === "metro"
                            ? `${seg.route_name || seg.route || "Metro"}`
                            : seg.route || seg.mode;

                const Icon = seg.mode === "metro" ? FaSubway : seg.mode === "bus" ? FaBus : FaWalking;

                return (
                    <Polyline key={i} positions={seg.shape} pathOptions={pathOptions}>
                        <Tooltip direction="center" offset={[0, 0]} opacity={0.95}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Icon style={{ width: 14, height: 14, color }} />
                                <div style={{ fontSize: 12, fontWeight: 600 }}>{tooltipText}</div>
                            </div>
                        </Tooltip>
                    </Polyline>
                );
            })}

            {/* Start -> Destination connector (thin dashed line) */}
            {start && end && (
                <Polyline
                    positions={[start, end]}
                    pathOptions={{
                        color: "#222",
                        weight: 2,
                        opacity: 0.5,
                        dashArray: "4 8",
                        lineCap: "round",
                    }}
                />
            )}
        </>
    );
}
