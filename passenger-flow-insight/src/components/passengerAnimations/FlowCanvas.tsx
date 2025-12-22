import React, { useRef, useEffect, useCallback } from "react";
import { ApiStation, StationEntry, Particle } from "@/lib/passengerFlowApi";
import { getFlowColor } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Plus, Minus } from "lucide-react";

interface FlowCanvasProps {
    stations: ApiStation[];
    currentData: StationEntry[];
    maxFlow: number;
    isPlaying: boolean;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({
    stations,
    currentData,
    maxFlow,
    isPlaying,
}) => {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number>();
    const particleIdRef = useRef(0);

    /* ---------- ZOOM STATE ---------- */
    const scaleRef = useRef(1);
    const offsetRef = useRef({ x: 0, y: 0 });

    const MIN_ZOOM = 0.6;
    const MAX_ZOOM = 3;
    const ZOOM_STEP = 1.2;

    const mouseRef = useRef<{ x: number; y: number } | null>(null);
    const hoveredStationRef = useRef<ApiStation | null>(null);

    /* ================= ZOOM CONTROLS ================= */
    const zoomAtCenter = (newScale: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        const scaleRatio = newScale / scaleRef.current;

        offsetRef.current.x =
            cx - scaleRatio * (cx - offsetRef.current.x);
        offsetRef.current.y =
            cy - scaleRatio * (cy - offsetRef.current.y);

        scaleRef.current = newScale;
    };

    const handleZoomIn = () => {
        zoomAtCenter(
            Math.min(MAX_ZOOM, scaleRef.current * ZOOM_STEP)
        );
    };

    const handleZoomOut = () => {
        zoomAtCenter(
            Math.max(MIN_ZOOM, scaleRef.current / ZOOM_STEP)
        );
    };

    /* ================= MOUSE EVENTS ================= */
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        mouseRef.current = {
            x: (e.clientX - rect.left - offsetRef.current.x) / scaleRef.current,
            y: (e.clientY - rect.top - offsetRef.current.y) / scaleRef.current,
        };
    };

    const handleMouseLeave = () => {
        mouseRef.current = null;
        hoveredStationRef.current = null;
    };

    /* ================= STATION FLOW ================= */
    const getStationFlow = useCallback(
        (stationName: string) => {
            const data = currentData.find((d) => d.station === stationName);
            return data
                ? { entry: data.entry, exit: data.exit }
                : { entry: 0, exit: 0 };
        },
        [currentData]
    );

    /* ================= SPAWN PARTICLES ================= */
    const spawnParticles = useCallback(() => {
        if (!isPlaying || maxFlow === 0) return;

        stations.forEach((station, index) => {
            const flow = getStationFlow(station.name);
            const intensity = Math.min(
                (flow.entry + flow.exit) / maxFlow,
                1
            );

            if (Math.random() < 0.15 + intensity * 0.4) {
                const target =
                    stations[(index + 1 + Math.floor(Math.random() * 5)) % stations.length];

                particlesRef.current.push(
                    {
                        id: particleIdRef.current++,
                        fromStation: target,
                        toStation: station,
                        progress: Math.random() * 0.3,
                        speed: 0.006 + intensity * 0.006,
                        intensity,
                        isEntry: true,
                    },
                    {
                        id: particleIdRef.current++,
                        fromStation: station,
                        toStation: target,
                        progress: Math.random() * 0.3,
                        speed: 0.006 + intensity * 0.006,
                        intensity,
                        isEntry: false,
                    }
                );
            }
        });

        if (particlesRef.current.length > 800) {
            particlesRef.current = particlesRef.current.slice(-600);
        }
    }, [stations, getStationFlow, maxFlow, isPlaying]);

    /* ================= DRAW LOOP ================= */
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.setTransform(
            scaleRef.current,
            0,
            0,
            scaleRef.current,
            offsetRef.current.x,
            offsetRef.current.y
        );

        ctx.fillStyle = isDark
            ? "rgba(10,14,23,0.12)"
            : "rgba(240,245,250,0.15)";
        ctx.fillRect(
            -offsetRef.current.x / scaleRef.current,
            -offsetRef.current.y / scaleRef.current,
            canvas.width / scaleRef.current,
            canvas.height / scaleRef.current
        );

        /* ---------- HOVER ---------- */
        hoveredStationRef.current = null;
        if (mouseRef.current) {
            const { x, y } = mouseRef.current;
            for (const s of stations) {
                if (Math.hypot(s.x - x, s.y - y) < 14) {
                    hoveredStationRef.current = s;
                    break;
                }
            }
        }

        /* ---------- PARTICLES ---------- */
        particlesRef.current = particlesRef.current.filter((p) => {
            p.progress += p.speed;
            if (p.progress >= 1) return false;

            const x = p.fromStation.x + (p.toStation.x - p.fromStation.x) * p.progress;
            const y = p.fromStation.y + (p.toStation.y - p.fromStation.y) * p.progress;

            ctx.fillStyle = getFlowColor(p.intensity);
            ctx.beginPath();
            ctx.arc(x, y, 3 + p.intensity * 6, 0, Math.PI * 2);
            ctx.fill();

            return true;
        });

        /* ---------- STATIONS ---------- */
        stations.forEach((s) => {
            const flow = getStationFlow(s.name);
            const intensity = Math.min(
                (flow.entry + flow.exit) / maxFlow,
                1
            );

            const color = s.line_color || "#9ca3af";
            const isHovered = hoveredStationRef.current?.id === s.id;

            const radius = isHovered ? 6 : 4;

            // Subtle glow
            const glow = ctx.createRadialGradient(
                s.x,
                s.y,
                0,
                s.x,
                s.y,
                radius * 3
            );
            glow.addColorStop(0, color);
            glow.addColorStop(1, "transparent");

            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(s.x, s.y, radius * 3, 0, Math.PI * 2);
            ctx.fill();

            // Core circle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
            ctx.fill();
        });

        /* ---------- TOOLTIP ---------- */
        if (hoveredStationRef.current) {
            const s = hoveredStationRef.current;
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            ctx.font = "12px Inter, sans-serif";
            const w = ctx.measureText(s.name).width;
            const sx = s.x * scaleRef.current + offsetRef.current.x + 12;
            const sy = s.y * scaleRef.current + offsetRef.current.y - 12;

            ctx.fillStyle = "rgba(0,0,0,0.75)";
            ctx.fillRect(sx - 6, sy - 14, w + 12, 20);

            ctx.fillStyle = "#fff";
            ctx.fillText(s.name, sx, sy);
        }

        spawnParticles();
        animationRef.current = requestAnimationFrame(draw);
    }, [stations, getStationFlow, maxFlow, spawnParticles, isDark]);

    /* ================= LIFECYCLE ================= */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const p = canvas.parentElement;
            if (p) {
                canvas.width = p.clientWidth;
                canvas.height = p.clientHeight;
            }
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
        <div className="relative w-full h-full">
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <button
                    onClick={handleZoomIn}
                    className="p-2 rounded-lg bg-black/60 text-white hover:bg-black"
                >
                    <Plus size={16} />
                </button>
                <button
                    onClick={handleZoomOut}
                    className="p-2 rounded-lg bg-black/60 text-white hover:bg-black"
                >
                    <Minus size={16} />
                </button>
            </div>

            <canvas
                ref={canvasRef}
                className="w-full h-full cursor-pointer"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            />
        </div>
    );
};

export default FlowCanvas;
