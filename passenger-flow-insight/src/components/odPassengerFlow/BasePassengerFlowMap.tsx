"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Station {
    name: string;
    lat: number;
    lng: number;
}

interface ODNode {
    name: string;
    lat: number;
    lng: number;
}

interface ODRecord {
    origin: ODNode;
    destination: ODNode;
    value: number;
}


interface Props {
    mode: "origin" | "destination" | "both";
    stations: Station[];
    odData: ODRecord[];
}

export default function BasePassengerFlowMap({
    mode,
    stations,
    odData,
}: Props) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);

    /* ================= MAP INIT ================= */
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [28.6139, 77.209],
            zoom: 11,
            zoomControl: true,
        });

        L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            { maxZoom: 19 }
        ).addTo(map);

        mapRef.current = map;

        // Station markers
        stations.forEach((s) => {
            L.circleMarker([s.lat, s.lng], {
                radius: 5,
                fillColor: "#ffffff",
                color: "#000",
                weight: 1,
                fillOpacity: 1,
            }).addTo(map);
        });

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [stations]);

    /* ================= CANVAS OVERLAY ================= */
    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;
        const canvas = document.createElement("canvas");
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "400";

        map.getContainer().appendChild(canvas);
        canvasRef.current = canvas;

        const resize = () => {
            const size = map.getSize();
            canvas.width = size.x * window.devicePixelRatio;
            canvas.height = size.y * window.devicePixelRatio;
            canvas.style.width = `${size.x}px`;
            canvas.style.height = `${size.y}px`;
        };

        resize();
        map.on("move zoom resize", resize);

        const ctx = canvas.getContext("2d")!;
        let t = 0;

        const animate = () => {
            if (!mapRef.current || !canvasRef.current) return;

            const ctx = canvasRef.current.getContext("2d");
            if (!ctx) return;

            ctx.setTransform(
                window.devicePixelRatio,
                0,
                0,
                window.devicePixelRatio,
                0,
                0
            );

            ctx.clearRect(
                0,
                0,
                canvas.width / window.devicePixelRatio,
                canvas.height / window.devicePixelRatio
            );

            odData.forEach((d, i) => {
                if (!d.origin || !d.destination) return;

                let from = d.origin;
                let to = d.destination;

                // 🔁 Direction control
                if (mode === "destination") {
                    from = d.destination;
                    to = d.origin;
                }

                // BOTH → randomly alternate direction
                if (mode === "both" && i % 2 === 0) {
                    from = d.destination;
                    to = d.origin;
                }

                let p1, p2;
                try {
                    p1 = map.latLngToContainerPoint([from.lat, from.lng]);
                    p2 = map.latLngToContainerPoint([to.lat, to.lng]);
                } catch {
                    return;
                }

                // number of particles per OD (based on passenger count)
                const particleCount = Math.min(Math.floor(d.value / 500), 8);

                for (let k = 0; k < particleCount; k++) {
                    const progress = ((t * 0.003) + (k / particleCount)) % 1;

                    const x = p1.x + (p2.x - p1.x) * progress;
                    const y = p1.y + (p2.y - p1.y) * progress;

                    ctx.beginPath();
                    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
                    ctx.fillStyle =
                        mode === "origin"
                            ? "#22c55e"       // green
                            : mode === "destination"
                                ? "#3b82f6"       // blue
                                : "#a855f7";      // purple
                    ctx.fill();
                }
            });

            t++;
            animationRef.current = requestAnimationFrame(animate);
        };


        animate();
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }

            map.off("move zoom resize", resize);
            canvas.remove();
        };
    }, [mode, odData, stations]);


    return (
        <div
            ref={containerRef}
            className="w-full h-[calc(100vh-72px)]"
        />
    );

}
