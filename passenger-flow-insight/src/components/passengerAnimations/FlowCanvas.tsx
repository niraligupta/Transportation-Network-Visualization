"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { ApiStation, StationEntry, Particle } from "@/lib/passengerFlowApi";
import { useTheme } from "next-themes";

/* ================= METRO ICON ================= */
const metroIcon = new Image();
metroIcon.src = "/icons/metro.png";

/* ================= TYPES ================= */
interface RouteShape {
    route_id: string;
    color: string;
    path: [number, number][];
}


/* ================= PROPS ================= */
interface FlowCanvasProps {
    routes?: RouteShape[];
    stations: ApiStation[];
    currentData: StationEntry[];
    maxFlow: number;
    isPlaying: boolean;
    leafletProject: (lat: number, lon: number) => { x: number; y: number };
}
/* ================= FLOW COLOR SCALE ================= */
function getFlowColor(intensity: number) {
    // intensity must be between 0 → 1
    if (intensity <= 0.2) return "hsl(145, 80%, 50%)"; // Very Low (Green)
    if (intensity <= 0.4) return "hsl(80, 90%, 55%)";  // Low (Yellow-Green)
    if (intensity <= 0.6) return "hsl(50, 100%, 55%)"; // Medium (Yellow)
    if (intensity <= 0.8) return "hsl(30, 100%, 55%)"; // High (Orange)
    return "hsl(0, 100%, 60%)";                        // Very High (Red)
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({
    routes,
    stations,
    currentData,
    maxFlow,
    isPlaying,
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

    /* ================= MOUSE EVENTS (🔥 REQUIRED) ================= */
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

    /* ================= STATION FLOW ================= */
    const getStationFlow = useCallback(
        (name: string) => {
            const row = currentData.find((d) => d.station === name);
            return row ? row.entry + row.exit : 0;
        },
        [currentData]
    );
    const stationFlowMap = useCallback(() => {
        const map: Record<string, { entry: number; exit: number }> = {};
        currentData.forEach((d) => {
            map[d.station] = {
                entry: d.entry,
                exit: d.exit,
            };
        });
        return map;
    }, [currentData]);

    /* ================= PARTICLES ================= */
    const spawnParticles = useCallback(() => {
        if (!isPlaying || maxFlow === 0 || !routes) return;

        const flowMap: Record<string, { entry: number; exit: number }> = {};
        currentData.forEach((d) => {
            flowMap[d.station] = { entry: d.entry, exit: d.exit };
        });

        routes.forEach((route) => {
            if (!route.path || route.path.length < 2) return;

            // route-level intensity
            let routeFlow = 0;

            route.path.forEach(([lat, lon]) => {
                stations.forEach((s) => {
                    if (
                        Math.abs(s.lat - lat) < 0.002 &&
                        Math.abs(s.lon - lon) < 0.002
                    ) {
                        const f = flowMap[s.name];
                        if (f) routeFlow += f.entry + f.exit;
                    }
                });
            });

            const intensity = Math.min(routeFlow / maxFlow, 1);


            // 🔥 particle spawn probability
            if (Math.random() < intensity * 0.08) {
                const segmentIndex = Math.floor(
                    Math.random() * (route.path.length - 1)
                );

                const entryExitRatio =
                    Math.random() < 0.5;

                particlesRef.current.push({
                    id: particleIdRef.current++,
                    routeId: route.route_id,
                    path: route.path,          // 🔒 STRICT LINE PATH
                    index: segmentIndex,       // 🔒 RANDOM LINE SEGMENT
                    progress: Math.random(),   // smooth start
                    speed: 0.003 + intensity * 0.01,
                    intensity,
                    isEntry: entryExitRatio,
                });
            }
        });

        if (particlesRef.current.length > 1200) {
            particlesRef.current = particlesRef.current.slice(-800);
        }
    }, [routes, stations, currentData, maxFlow, isPlaying]);





    /* ================= DRAW LOOP ================= */
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        /* background */
        ctx.fillStyle = isDark
            ? "rgba(10,14,23,0.25)"
            : "rgba(240,245,250,0.25)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        /* ================= METRO LINES (SOLID, NO BORDER) ================= */
        if (Array.isArray(routes)) {
            routes.forEach((route) => {
                if (
                    route.color === "#000000" ||
                    route.color === "black" ||
                    route.color === "#0b1220"
                ) {
                    return;
                }
                if (!route.path || route.path.length < 2) return;

                ctx.beginPath();
                route.path.forEach(([a, b], i) => {
                    const lat = Math.abs(a) <= 90 ? a : b;
                    const lon = Math.abs(a) <= 90 ? b : a;
                    const { x, y } = leafletProject(lat, lon);

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });

                ctx.strokeStyle = route.color;
                ctx.lineWidth = 6;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.stroke();
            });
        }

        /* ================= HOVER DETECTION ================= */
        hoveredStationRef.current = null;
        if (mouseRef.current) {
            for (const s of stations) {
                const { x, y } = leafletProject(s.lat, s.lon);
                if (
                    Math.abs(x - mouseRef.current.x) < 10 &&
                    Math.abs(y - mouseRef.current.y) < 10
                ) {
                    hoveredStationRef.current = s;
                    break;
                }
            }
        }

        /* ================= PARTICLES ================= */
        particlesRef.current = particlesRef.current.filter((p) => {
            const path = p.path;
            if (p.index >= path.length - 1) return false;

            p.progress += p.speed;

            if (p.progress >= 1) {
                p.progress = 0;
                p.index++;
            }

            const [a1, b1] = path[p.index];
            const [a2, b2] = path[p.index + 1];

            const lat1 = Math.abs(a1) <= 90 ? a1 : b1;
            const lon1 = Math.abs(a1) <= 90 ? b1 : a1;
            const lat2 = Math.abs(a2) <= 90 ? a2 : b2;
            const lon2 = Math.abs(a2) <= 90 ? b2 : a2;

            const from = leafletProject(lat1, lon1);
            const to = leafletProject(lat2, lon2);

            const x = from.x + (to.x - from.x) * p.progress;
            const y = from.y + (to.y - from.y) * p.progress;
            const baseColor = getFlowColor(p.intensity);

            ctx.fillStyle = p.isEntry
                ? baseColor
                : baseColor.replace(")", ", 0.65)").replace("hsl", "hsla");


            ctx.beginPath();
            ctx.arc(x, y, 3 + p.intensity * 3, 0, Math.PI * 2);
            ctx.fill();

            return true;
        });


        /* ================= STATIONS ================= */
        if (metroIcon.complete) {
            stations.forEach((s) => {
                const { x, y } = leafletProject(s.lat, s.lon);
                ctx.drawImage(metroIcon, x - 7, y - 7, 14, 14);
            });
        }
        const hoveredFlow =
            hoveredStationRef.current
                ? currentData.find(
                    (d) => d.station === hoveredStationRef.current?.name
                )
                : null;

        /* ================= STATION TOOLTIP ================= */
        if (hoveredStationRef.current) {
            const s = hoveredStationRef.current;
            const flow = hoveredFlow;
            const { x, y } = leafletProject(s.lat, s.lon);

            const lines = [
                s.name,
                ` Boarding: ${flow?.entry ?? 0}`,
                ` Alighting: ${flow?.exit ?? 0}`,
            ];

            ctx.font = "12px Inter, sans-serif";
            const padding = 6;
            const lineHeight = 16;
            const width = Math.max(
                ...lines.map((l) => ctx.measureText(l).width)
            );

            const boxWidth = width + padding * 2;
            const boxHeight = lines.length * lineHeight + padding * 2;

            ctx.fillStyle = "rgba(0,0,0,0.8)";
            ctx.fillRect(x + 12, y - boxHeight - 12, boxWidth, boxHeight);

            ctx.fillStyle = "#fff";
            lines.forEach((text, i) => {
                ctx.fillText(
                    text,
                    x + 12 + padding,
                    y - boxHeight + padding + (i + 1) * lineHeight
                );
            });
        }


        spawnParticles();
        animationRef.current = requestAnimationFrame(draw);
    }, [
        routes,
        stations,
        spawnParticles,
        isDark,
        leafletProject,
        getStationFlow,
        maxFlow,
        isPlaying,
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
            style={{ pointerEvents: "auto" }}   // 🔥 IMPORTANT
        />
    );
};

export default FlowCanvas;
