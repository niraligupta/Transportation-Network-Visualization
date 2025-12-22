// src/components/map/TripMarkers.jsx
import React from "react";
import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { FaSubway } from "react-icons/fa";

const ROUTE_COLORS = {
    RED: "#D32F2F",
    BLUE: "#1976D2",
    GREEN: "#388E3C",
    YELLOW: "#FBC02D",
    ORANGE: "#FB8C00",
    MAGENTA: "#C2185B",
    AQUA: "#0097A7",
    GRAY: "#9E9E9E",
    VIOLET: "#7B1FA2",
};

const circleIcon = (color, size = 12) =>
    new L.DivIcon({
        html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};box-shadow:0 0 0 3px rgba(255,255,255,0.6);
      transform: translate(-50%,-50%);"></div>`,
        className: "",
        iconSize: [size, size],
    });

const subwayIcon = (color) =>
    new L.DivIcon({
        html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:20px;height:20px;border-radius:6px;
      background:${color};color:#fff;font-size:12px;
      transform: translate(-50%,-50%);
    ">🚇</div>`,
        className: "",
        iconSize: [20, 20],
    });

export default function TripMarkers({ segments }) {
    if (!segments || !segments.length) return null;

    const markers = [];

    segments.forEach((seg) => {
        if (!seg.shape) return;
        // pick every Nth to avoid overload
        const step = Math.max(1, Math.floor(seg.shape.length / 8));
        seg.shape.forEach((pt, idx) => {
            if (idx % step !== 0) return;
            const colorName = (seg.route_color || seg.route || "").toString().toUpperCase();
            const color = ROUTE_COLORS[colorName] || (seg.mode === "walk" ? "#999" : "#555");
            markers.push({
                pos: pt,
                title: seg.on_stop || seg.route_name || (seg.mode === "walk" ? "Walk" : seg.mode),
                color,
                mode: seg.mode,
            });
        });
    });

    // start and end
    const start = segments[0]?.shape?.[0];
    const last = segments[segments.length - 1];
    const end = last?.shape?.slice(-1)?.[0];

    return (
        <>
            {start && (
                <Marker
                    position={start}
                    icon={circleIcon("#2E7D32", 16)}
                >
                    <Tooltip>Start</Tooltip>
                </Marker>
            )}

            {end && (
                <Marker position={end} icon={circleIcon("#C62828", 16)}>
                    <Tooltip>Destination</Tooltip>
                </Marker>
            )}

            {markers.map((m, i) => (
                <Marker
                    key={i}
                    position={m.pos}
                    icon={m.mode === "metro" ? subwayIcon(m.color) : circleIcon(m.color, 10)}
                >
                    <Tooltip direction="top">{m.title}</Tooltip>
                </Marker>
            ))}
        </>
    );
}
