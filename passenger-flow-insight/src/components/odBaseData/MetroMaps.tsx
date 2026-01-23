"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Station, FlowArc } from "@/types/metro";

/* ================= PROPS ================= */
interface MetroMapProps {
  stations: Station[];
  arcs: FlowArc[];
  selectedStation: string | null;
  minPassengers: number;
  flowDirection: "outbound" | "inbound" | "both";
  onStationSelect: (stationName: string | null) => void;
  animationSpeed: number;
  isPlaying: boolean;
}

/* ================= COLORS ================= */
const PURPLE_OUTBOUND = "#A855F7";
const PURPLE_INBOUND = "#7C3AED";
const PURPLE_BOTH = "#C084FC";

/* ================= WIDTH SCALE ================= */
function getArcWidth(value: number, max: number) {
  const MIN = 0.6;
  const MAX = 8;
  if (max === 0) return MIN;

  const t = Math.sqrt(value / max); // perceptual scaling
  return MIN + t * (MAX - MIN);
}

/* ================= COMPONENT ================= */
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

  /* ================= MAP INIT ================= */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      center: [28.6139, 77.209],
      zoom: 11,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);

    map.createPane("stationPane");
    map.getPane("stationPane")!.style.zIndex = "650";

    mapRef.current = map;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ================= GLOBAL MAX ================= */
  const maxPassengers = useMemo(() => {
    return Math.max(...arcs.map(a => a.value), 1);
  }, [arcs]);

  /* ================= STATION STATS ================= */
  const stationStats = useMemo(() => {
    const stats: Record<
      string,
      {
        boarding: number;
        alighting: number;
        inboundFromSelected: number;
        outboundToSelected: number;
      }
    > = {};

    stations.forEach(s => {
      stats[s.name] = {
        boarding: 0,
        alighting: 0,
        inboundFromSelected: 0,
        outboundToSelected: 0,
      };
    });

    arcs.forEach(a => {
      const o = a.origin.name;
      const d = a.destination.name;
      const v = a.value;

      // total
      stats[o].boarding += v;
      stats[d].alighting += v;

      // selected station logic
      if (selectedStation) {
        if (o === selectedStation) {
          stats[d].inboundFromSelected += v; // A → B
        }
        if (d === selectedStation) {
          stats[o].outboundToSelected += v; // B → A
        }
      }
    });

    return stats;
  }, [stations, arcs, selectedStation]);

  /* ================= STATION MARKERS ================= */
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    stations.forEach(station => {
      const isSelected = station.name === selectedStation;
      const stats = stationStats[station.name];

      const marker = L.circleMarker(
        [station.lat, station.lng],
        {
          pane: "stationPane",
          radius: isSelected ? 9 : 6,
          fillColor: "#ffffff",
          color: "#000",
          weight: isSelected ? 3 : 2,
          fillOpacity: 1,
        }
      );

      const tooltipHTML = `
  <div style="font-size:12px; line-height:1.4">
    <strong>${station.name}</strong><br/>
    🟢 Boarding: <b>${stats.boarding}</b><br/>
    🔵 Alighting: <b>${stats.alighting}</b>

    ${selectedStation
          ? `
          <hr style="margin:6px 0; border-color:#444"/>
          <span style="color:#A855F7">
            Selected: <b>${selectedStation}</b>
          </span><br/>
          ⬅️ Inbound from ${selectedStation}: 
          <b>${stats.inboundFromSelected}</b><br/>
          ➡️ Outbound to ${selectedStation}: 
          <b>${stats.outboundToSelected}</b>
        `
          : ""
        }
  </div>
`;

      marker.bindTooltip(tooltipHTML, {
        sticky: true,
        opacity: 0.97,
        direction: "top",
      });


      marker.on("click", () =>
        onStationSelect(
          selectedStation === station.name ? null : station.name
        )
      );

      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
  }, [stations, selectedStation, stationStats, isMapReady, onStationSelect]);

  /* ================= CANVAS OVERLAY ================= */
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    const container = mapRef.current.getContainer();
    let canvas = canvasRef.current;

    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "400";
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
    mapRef.current.on("resize move zoom", resize);
    return () => mapRef.current?.off("resize move zoom", resize);
  }, [isMapReady]);

  /* ================= FILTER ARCS ================= */
  const filteredArcs = useMemo(() => {
    return arcs.filter(a => {
      if (a.value < minPassengers) return false;
      if (!selectedStation) return true;

      if (flowDirection === "outbound") return a.origin.name === selectedStation;
      if (flowDirection === "inbound") return a.destination.name === selectedStation;

      return (
        a.origin.name === selectedStation ||
        a.destination.name === selectedStation
      );
    });
  }, [arcs, selectedStation, minPassengers, flowDirection]);

  /* ================= DRAW ARCS ================= */
  const drawArcs = useCallback(
    (time: number) => {
      if (!canvasRef.current || !mapRef.current) {
        animationRef.current = requestAnimationFrame(drawArcs);
        return;
      }

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(
        0,
        0,
        canvasRef.current.width / dpr,
        canvasRef.current.height / dpr
      );

      const progress = isPlaying
        ? (time * 0.0004 * animationSpeed) % 1
        : 0;

      filteredArcs.forEach((arc, i) => {
        let color = PURPLE_BOTH;
        let dir = 1;

        if (selectedStation) {
          if (arc.origin.name === selectedStation) {
            color = PURPLE_OUTBOUND;
            dir = 1;
          } else if (arc.destination.name === selectedStation) {
            color = PURPLE_INBOUND;
            dir = -1;
          }
        }

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

        const h = Math.min(dist * 0.45, 160) * dir;
        const cx = mx - (dy / dist) * h;
        const cy = my + (dx / dist) * h;

        const width = getArcWidth(arc.value, maxPassengers);

        /* Glow */
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = width * 1.8;
        ctx.stroke();

        /* Main */
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = width;
        ctx.stroke();

        ctx.globalAlpha = 1;

        /* Particle */
        if (isPlaying) {
          const t = (progress + i * 0.02) % 1;
          const x =
            (1 - t) ** 2 * p1.x +
            2 * (1 - t) * t * cx +
            t ** 2 * p2.x;
          const y =
            (1 - t) ** 2 * p1.y +
            2 * (1 - t) * t * cy +
            t ** 2 * p2.y;

          ctx.beginPath();
          ctx.arc(x, y, 2 + width * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(drawArcs);
    },
    [filteredArcs, isPlaying, animationSpeed, selectedStation, maxPassengers]
  );

  /* ================= LOOP ================= */
  useEffect(() => {
    animationRef.current = requestAnimationFrame(drawArcs);
    return () => cancelAnimationFrame(animationRef.current);
  }, [drawArcs]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ background: "hsl(220 30% 4%)" }}
    />
  );
}
