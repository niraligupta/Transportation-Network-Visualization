"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { ApiStation, StationEntry, Particle } from "@/lib/passengerFlowApi";
import { useTheme } from "next-themes";

/* ================= TYPES ================= */
export type VisualizationMode = "BOARDING" | "ALIGHTING" | "FLOW";

interface RouteShape {
    route_id: string;
    color: string;
    path: [number, number][];
}

interface FlowCanvasProps {
    routes?: RouteShape[];
    stations: ApiStation[];
    currentData: StationEntry[];
    maxFlow: number;
    isPlaying: boolean;
    mode: VisualizationMode;
    leafletProject: (lat: number, lon: number) => { x: number; y: number };
}

/* ================= HELPERS ================= */
function getFlowColor(intensity: number) {
    if (intensity <= 0.2) return "hsl(145, 80%, 50%)";
    if (intensity <= 0.4) return "hsl(80, 90%, 55%)";
    if (intensity <= 0.6) return "hsl(50, 100%, 55%)";
    if (intensity <= 0.8) return "hsl(30, 100%, 55%)";
    return "hsl(0, 100%, 60%)";
}

function getStationData(
    station: ApiStation,
    data: StationEntry[]
) {
    return (
        data.find((d) => d.station === station.name) || {
            entry: 0,
            exit: 0,
        }
    );
}

function getCircleRadius(value: number, max: number) {
    const minR = 4;
    const maxR = 18;
    if (max === 0) return minR;
    return minR + (value / max) * (maxR - minR);
}

/* ================= COMPONENT ================= */
const FlowCanvas: React.FC<FlowCanvasProps> = ({
    routes,
    stations,
    currentData,
    maxFlow,
    isPlaying,
    mode,
    leafletProject,
}) => {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const particlesRef = useRef<Particle[]>([]);
    const particleIdRef = useRef(0);

    const mouseRef = useRef<{ x: number; y: number } | null>(null);
    const hoveredStationRef = useRef<ApiStation | null>(null);

    /* ================= MOUSE ================= */
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        mouseRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handleMouseLeave = () => {
        mouseRef.current = null;
        hoveredStationRef.current = null;
    };

    /* ================= PARTICLES ================= */
    const spawnParticles = useCallback(() => {
        if (!isPlaying || mode !== "FLOW" || !routes || maxFlow === 0) return;

        const totalFlow =
            currentData.reduce((s, d) => s + d.entry + d.exit, 0) || 1;

        routes.forEach((route) => {
            if (!route.path || route.path.length < 2) return;

            const intensity = Math.min(totalFlow / maxFlow, 1);

            if (Math.random() < intensity * 0.15) {
                particlesRef.current.push({
                    id: particleIdRef.current++,
                    routeId: route.route_id,
                    path: route.path,
                    index: Math.floor(Math.random() * (route.path.length - 1)),
                    progress: Math.random(),
                    speed: 0.01 + intensity * 0.03,
                    intensity,
                    isEntry: Math.random() < 0.5,
                });
            }
        });

        if (particlesRef.current.length > 1500) {
            particlesRef.current = particlesRef.current.slice(-1000);
        }
    }, [routes, currentData, maxFlow, isPlaying, mode]);

    /* ================= DRAW ================= */
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        /* Background */
        ctx.fillStyle = isDark
            ? "rgba(10,14,23,0.25)"
            : "rgba(240,245,250,0.25)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        /* ================= STATION CIRCLES ================= */
        hoveredStationRef.current = null;

        stations.forEach((station) => {
            const { x, y } = leafletProject(station.lat, station.lon);
            const data = getStationData(station, currentData);

            // 🔹 Size depends on visualization mode
            let value = 0;
            if (mode === "BOARDING") {
                value = data.entry;
            } else if (mode === "ALIGHTING") {
                value = data.exit;
            } else {
                value = data.entry + data.exit;
            }

            // 🔹 Color ALWAYS depends on flow intensity
            const totalFlow = data.entry + data.exit;
            const intensity = maxFlow > 0 ? totalFlow / maxFlow : 0;
            const color = getFlowColor(intensity);


            const radius = getCircleRadius(value, maxFlow);

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.fill();
            ctx.shadowBlur = 0;

            /* Hover detect */
            if (
                mouseRef.current &&
                Math.hypot(
                    x - mouseRef.current.x,
                    y - mouseRef.current.y
                ) <= radius + 4
            ) {
                hoveredStationRef.current = station;
            }
        });

        /* ================= PARTICLES ================= */
        if (mode === "FLOW") {
            particlesRef.current = particlesRef.current.filter((p) => {
                if (p.index >= p.path.length - 1) return false;

                p.progress += p.speed;
                if (p.progress >= 1) {
                    p.progress = 0;
                    p.index++;
                }

                const [a1, b1] = p.path[p.index];
                const [a2, b2] = p.path[p.index + 1];

                const from = leafletProject(a1, b1);
                const to = leafletProject(a2, b2);

                const x = from.x + (to.x - from.x) * p.progress;
                const y = from.y + (to.y - from.y) * p.progress;

                const color = getFlowColor(p.intensity);

                ctx.beginPath();
                ctx.arc(x, y, 3 + p.intensity * 3, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();

                return true;
            });

            spawnParticles();
        }

        /* ================= TOOLTIP ================= */
        if (hoveredStationRef.current) {
            const s = hoveredStationRef.current;
            const d = getStationData(s, currentData);
            const { x, y } = leafletProject(s.lat, s.lon);

            const lines = [
                s.name,
                `Boarding: ${d.entry}`,
                `Alighting: ${d.exit}`,
            ];

            ctx.font = "12px Inter, sans-serif";
            const padding = 6;
            const lineHeight = 16;
            const width = Math.max(...lines.map((l) => ctx.measureText(l).width));

            ctx.fillStyle = "rgba(0,0,0,0.8)";
            ctx.fillRect(x + 12, y - 60, width + padding * 2, 56);

            ctx.fillStyle = "#fff";
            lines.forEach((t, i) => {
                ctx.fillText(t, x + 12 + padding, y - 36 + i * lineHeight);
            });
        }

        animationRef.current = requestAnimationFrame(draw);
    }, [
        stations,
        currentData,
        maxFlow,
        mode,
        spawnParticles,
        leafletProject,
        isDark,
    ]);

    /* ================= LIFECYCLE ================= */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const p = canvas.parentElement;
            if (!p) return;
            canvas.width = p.clientWidth;
            canvas.height = p.clientHeight;
        };

        resize();
        window.addEventListener("resize", resize);
        animationRef.current = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener("resize", resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [draw]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-[500]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ pointerEvents: "auto" }}
        />
    );
};

export default FlowCanvas;
