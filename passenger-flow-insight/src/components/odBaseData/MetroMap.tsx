import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Station, FlowArc } from '@/types/metro';

interface MetroMapProps {
    stations: Station[];
    arcs: FlowArc[];
    selectedStation: string | null;
    minPassengers: number;
    flowDirection: 'outbound' | 'inbound' | 'both';
    onStationSelect: (stationName: string | null) => void;
    animationSpeed: number;
    isPlaying: boolean;
}

const LINE_COLOR_MAP: Record<string, string> = {
    Red: '#E11D48',
    Yellow: '#FACC15',
    Blue: '#2563EB',
    Green: '#16A34A',
    Violet: '#7C3AED',
    Megenta: '#D946EF',
    Pink: '#EC4899',
    Aqua: '#00FFFF',
    Grey: '#9CA3AF',
};

const DEFAULT_LINE_COLOR = '#22D3EE';
function getArcCount(passengers: number) {
    if (passengers < 100) return 1;
    if (passengers < 500) return 2;
    if (passengers < 1000) return 4;
    if (passengers < 3000) return 6;
    return 8; // max cap (performance safe)
}

export function MetroMap({
    stations,
    arcs,
    selectedStation,
    minPassengers,
    flowDirection,
    onStationSelect,
    animationSpeed,
    isPlaying,
}: MetroMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number>(0);
    const markersRef = useRef<L.CircleMarker[]>([]);
    const [isMapReady, setIsMapReady] = useState(false);

    /* ---------------- MAP INIT ---------------- */
    useEffect(() => {
        if (!mapContainer.current || mapRef.current) return;

        const map = L.map(mapContainer.current, {
            center: [28.6139, 77.209],
            zoom: 11,
            zoomControl: true,
            attributionControl: false,
        });

        L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            { maxZoom: 19 }
        ).addTo(map);
        map.createPane('stationPane');
        map.getPane('stationPane')!.style.zIndex = '650';
        mapRef.current = map;
        setIsMapReady(true);

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    /* ---------------- STATION MARKERS ---------------- */
    const stationStats = useMemo(() => {
        const stats: Record<
            string,
            {
                originTotal: number;
                destinationTotal: number;
                inboundFromSelected: number;
                outboundFromSelected: number;
            }
        > = {};

        // initialize
        stations.forEach(s => {
            stats[s.name] = {
                originTotal: 0,
                destinationTotal: 0,
                inboundFromSelected: 0,
                outboundFromSelected: 0,
            };
        });

        arcs.forEach(arc => {
            const o = arc.origin.name;
            const d = arc.destination.name;
            const v = arc.value;

            // total counts
            if (stats[o]) stats[o].originTotal += v;
            if (stats[d]) stats[d].destinationTotal += v;

            // selected station logic
            if (selectedStation) {
                if (o === selectedStation && stats[d]) {
                    stats[d].inboundFromSelected += v;
                }
                if (d === selectedStation && stats[o]) {
                    stats[o].outboundFromSelected += v;
                }
            }
        });

        return stats;
    }, [arcs, stations, selectedStation]);


    useEffect(() => {
        if (!mapRef.current || !isMapReady) return;

        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        stations.forEach(station => {
            const isSelected = station.name === selectedStation;

            const color = LINE_COLOR_MAP[station.line_color ?? ''] || DEFAULT_LINE_COLOR;

            const marker = L.circleMarker(
                [station.lat, station.lng],
                {
                    pane: 'stationPane',
                    radius: isSelected ? 9 : 6,
                    fillColor: color,
                    color: '#ffffff',
                    weight: isSelected ? 3 : 2,
                    fillOpacity: 1,
                    opacity: 1,

                }
            );

            const stats = stationStats[station.name];

            const tooltipHTML = `
  <div style="font-size:12px; line-height:1.4">
    <strong>${station.name}</strong><br/>
    🟢 Origin Total: <b>${stats?.originTotal ?? 0}</b><br/>
    🔵 Destination Total: <b>${stats?.destinationTotal ?? 0}</b>
    ${selectedStation
                    ? `<hr style="margin:4px 0"/>
           ⬅️ Inbound (from ${selectedStation}): <b>${stats?.inboundFromSelected ?? 0}</b><br/>
           ➡️ Outbound (to ${selectedStation}): <b>${stats?.outboundFromSelected ?? 0}</b>`
                    : ''
                }
  </div>
`;

            marker.bindTooltip(tooltipHTML, {
                direction: 'top',
                sticky: true,
                // opacity: 0.95,
                opacity: 0.98,
                className: 'station-tooltip',
            });


            marker.on('click', () => {
                onStationSelect(
                    selectedStation === station.name ? null : station.name
                );
            });

            marker.addTo(mapRef.current!);
            markersRef.current.push(marker);
        });
    }, [stations, selectedStation, isMapReady, onStationSelect]);




    /* ---------------- CANVAS OVERLAY ---------------- */
    useEffect(() => {
        if (!mapRef.current || !isMapReady) return;

        const container = mapRef.current.getContainer();
        let canvas = canvasRef.current;

        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '400';
            container.appendChild(canvas);
            canvasRef.current = canvas;
        }

        const resize = () => {
            const size = mapRef.current!.getSize();
            const dpr = window.devicePixelRatio || 1;

            canvas!.width = size.x * dpr;
            canvas!.height = size.y * dpr;
            canvas!.style.width = `${size.x}px`;
            canvas!.style.height = `${size.y}px`;
        };

        resize();
        mapRef.current.on('resize move zoom', resize);

        return () => {
            mapRef.current?.off('resize move zoom', resize);
        };
    }, [isMapReady]);

    /* ---------------- FILTER ARCS ---------------- */
    const filteredArcs = useMemo(() => {
        return arcs.filter(arc => {
            if (arc.value < minPassengers) return false;
            if (!selectedStation) return true;

            if (flowDirection === 'outbound') {
                return arc.origin.name === selectedStation;
            }

            if (flowDirection === 'inbound') {
                return arc.destination.name === selectedStation;
            }

            return (
                arc.origin.name === selectedStation ||
                arc.destination.name === selectedStation
            );
        });
    }, [arcs, selectedStation, minPassengers, flowDirection]);

    /* ---------------- ARC DRAWING ---------------- */
    const drawArcs = useCallback(
        (time: number) => {
            if (!canvasRef.current || !mapRef.current) {
                animationRef.current = requestAnimationFrame(drawArcs);
                return;
            }

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const dpr = window.devicePixelRatio || 1;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            ctx.clearRect(
                0,
                0,
                canvas.width / dpr,
                canvas.height / dpr
            );

            const progress = isPlaying
                ? (time * 0.0004 * animationSpeed) % 1
                : 0;


            filteredArcs.forEach((arc, i) => {
                const arcCount =
                    selectedStation
                        ? getArcCount(arc.value)
                        : 1;

                for (let k = 0; k < arcCount; k++) {
                    const offsetFactor = (k - arcCount / 2) * 0.15; // arc spread

                    const color = LINE_COLOR_MAP[arc.origin.line_color ?? ''] || DEFAULT_LINE_COLOR;




                    const p1 = mapRef.current!.latLngToContainerPoint([
                        arc.origin.lat,
                        arc.origin.lng,
                    ]);
                    const p2 = mapRef.current!.latLngToContainerPoint([
                        arc.destination.lat,
                        arc.destination.lng,
                    ]);

                    const mx = (p1.x + p2.x) / 2;
                    const my = (p1.y + p2.y) / 2;
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const h = Math.min(dist * 0.3, 100) + offsetFactor * 40;

                    const cx = mx - (dy / dist) * h;
                    const cy = my + (dx / dist) * h;

                    const width = 0.6 + arc.normalizedValue * 2;

                    /* ---------- Glow ---------- */
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
                    ctx.strokeStyle = color;
                    ctx.globalAlpha = 0.12;
                    ctx.lineWidth = width * 2.2;
                    ctx.stroke();

                    /* ---------- Main ---------- */
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
                    ctx.strokeStyle = color;
                    ctx.globalAlpha = 0.45;
                    ctx.lineWidth = width;
                    ctx.stroke();

                    ctx.globalAlpha = 1;

                    /* ---------- Particle ---------- */
                    if (isPlaying) {
                        const t = (progress + (i + k) * 0.02) % 1;

                        const x =
                            (1 - t) ** 2 * p1.x +
                            2 * (1 - t) * t * cx +
                            t ** 2 * p2.x;

                        const y =
                            (1 - t) ** 2 * p1.y +
                            2 * (1 - t) * t * cy +
                            t ** 2 * p2.y;

                        ctx.beginPath();
                        ctx.arc(x, y, 1.8 + arc.normalizedValue * 2, 0, Math.PI * 2);
                        ctx.fillStyle = color;
                        ctx.fill();
                    }
                }
            });

            animationRef.current = requestAnimationFrame(drawArcs);
        },
        [filteredArcs, isPlaying, animationSpeed]
    );

    useEffect(() => {
        animationRef.current = requestAnimationFrame(drawArcs);
        return () => cancelAnimationFrame(animationRef.current);
    }, [drawArcs]);

    return (
        <div
            ref={mapContainer}
            className="w-full h-full rounded-lg overflow-hidden"
            style={{ background: 'hsl(220 30% 4%)' }}
        />
    );
}
