import { useEffect, useMemo, useRef, useState } from "react";
import { TransportLegend } from "./TransportLegend";
import { TimeDisplay } from "./TimeDisplay";
import { DataStats } from "./DataStats";
import { RouteTooltip } from "./RouteTooltip";
import { useTransportData } from "@/hooks/useTransportData";
import { useLiveMetros } from "@/hooks/useLiveMetros"; // NEW IMPORT
import { ProcessedRoute, LiveMetro } from "@/types/transport"; // Updated import for LiveMetro

import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-ant-path";

// NEW: Sub-component for live metro markers to handle refs and updates
const LiveMetroMarker = ({
  metro,
  color,
  isStopped,
}: {
  metro: LiveMetro;
  color: string;
  isStopped: boolean;
}) => {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([metro.current_lat, metro.current_lon]);
    }
  }, [metro.current_lat, metro.current_lon]);

  const iconHtml = `
    <style>
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
        70% { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
        100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
      }
    </style>
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; border: 2px solid white;">
        🚆
      </div>
      ${isStopped ? `<div style="position: absolute; top: 0; left: 0; width: 24px; height: 24px; border-radius: 50%; animation: pulse 1.5s infinite; background: transparent;"></div>` : ''}
    </div>
  `;

  const icon = L.divIcon({
    html: iconHtml,
    className: "live-metro-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <Marker ref={markerRef} position={[metro.current_lat, metro.current_lon]} icon={icon}>
      <Tooltip direction="top" offset={[0, -20]}>
        <div>
          <strong>From:</strong> {metro.from_stop}<br />
          <strong>Next:</strong> {metro.next_stop}<br />
          <strong>Progress:</strong> {metro.progress.toFixed(2)}%
        </div>
      </Tooltip>
    </Marker>
  );
};

export const TransportFlowVisualization = () => {
  const { routes, isLoading, isError, error, refetch } = useTransportData();
  const { liveMetros, prevMetrosMap } = useLiveMetros(); // NEW: Use the live metros hook
  const [hoveredRoute, setHoveredRoute] = useState<ProcessedRoute | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mapRef = useRef<L.Map | null>(null);

  // NEW: Memoized map of route_id to color
  const routeIdToColor = useMemo(() => {
    return routes.reduce((acc, r) => {
      acc[r.id] = r.color;
      return acc;
    }, {} as Record<string, string>);
  }, [routes]);

  const AnimatedPaths = () => {
    const map = useMap();
    useEffect(() => {
      if (!map || routes.length === 0) return;
      import("leaflet-ant-path").then(({ antPath }) => {
        routes
          .filter(r => r.type !== "metro")
          .forEach(route =>
            antPath(route.latlonPath, {
              delay: 900,
              weight: 4,
              color: route.color,
              pulseColor: "#fff",
              opacity: 0.8,
            }).addTo(map)
          );
      });
    }, [routes, map]);
    return null;
  };

  useEffect(() => {
    if (mapRef.current && routes.length > 0) {
      const bounds = L.latLngBounds(routes.flatMap(r => r.latlonPath));
      mapRef.current.fitBounds(bounds, { padding: [100, 100] });
    }
  }, [routes]);

  if (isLoading) return <div className="w-screen h-screen bg-black text-white flex items-center justify-center text-2xl">Loading...</div>;
  if (isError) return <div className="w-screen h-screen bg-black text-red-500 flex flex-col items-center justify-center">Error: {error?.message}<button onClick={refetch} className="mt-4 px-6 py-3 bg-red-600 rounded">Retry</button></div>;
  if (routes.length === 0) return <div className="w-screen h-screen bg-black text-white flex items-center justify-center">No data</div>;

  const metroRoutes = routes.filter(r => r.type === "metro");
  const otherRoutes = routes.filter(r => r.type !== "metro");

  return (
    <div className="fixed inset-0 bg-gray-950 text-white overflow-hidden">

      {/* LEFT SIDEBAR - Legend Only */}
      <div className="fixed left-0 top-0 h-full w-80 bg-black/95 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white/90">DELHI TRANSPORT NETWORK</h2>
          <p className="text-xs text-gray-400 mt-1">Metro Lines</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/20">
          <TransportLegend />
          <p className="text-xs text-gray-500 mt-8">Hover routes for details</p>
        </div>
      </div>

      {/* RIGHT SIDEBAR - Data Stats */}
      <div className="fixed right-0 top-0 h-full w-80 bg-black/95 backdrop-blur-xl border-l border-white/10 z-50 p-6 flex flex-col justify-center space-y-8">
        <DataStats />
      </div>

      {/* TIME DISPLAY - Top Right Corner */}
      <div className="fixed top-6 right-6 z-50 pointer-events-auto">
        <TimeDisplay />
      </div>

      {/* MAIN MAP - Full center area */}
      <div className="absolute inset-0 ml-80 mr-80">
        <MapContainer
          center={[28.6139, 77.2090]}
          zoom={11}
          ref={mapRef}
          className="w-full h-full"
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <AnimatedPaths />

          {/* Metro Lines */}
          {metroRoutes.map(route => (
            <Polyline
              key={route.id}
              positions={route.latlonPath}
              color={route.color}
              weight={7}
              opacity={0.9}
              lineCap="round"
              lineJoin="round"
              eventHandlers={{
                mouseover: () => setHoveredRoute(route),
                mouseout: () => setHoveredRoute(null),
              }}
            />
          ))}

          {/* Invisible hover zones for animated routes */}
          {otherRoutes.map(route => (
            <Polyline
              key={route.id}
              positions={route.latlonPath}
              color="transparent"
              weight={14}
              eventHandlers={{
                mouseover: () => setHoveredRoute(route),
                mouseout: () => setHoveredRoute(null),
              }}
            />
          ))}

          {/* Metro Stations */}
          {/* {metroRoutes.flatMap(route =>
            route.stations.map((s, i) => (
              <Marker
                key={`${route.id}-${i}`}
                position={[s.lat, s.lon]}
                icon={L.divIcon({
                  html: `<div style="background:${route.color}; width:28px; height:28px; border-radius:50%; border:5px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; font-weight:bold; color:white; font-size:14px;">M</div>`,
                  iconSize: [28, 28],
                  iconAnchor: [14, 14],
                })}
              >
                <Tooltip direction="top" offset={[0, -12]}>{s.name}</Tooltip>
              </Marker>
            ))
          )} */}
          {metroRoutes.flatMap(route =>
            route.stations.map((s, i) => (
              <Marker
                key={`${route.id}-${i}`}
                position={[s.lat, s.lon]}
                icon={L.divIcon({
                  html: `
    <div style="
      background: transparent;
      border: none;
      padding: 0;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <img src="/delhi-metro-logo.png"
           style="width: 26px; height: 26px; display:block;" />
    </div>
  `,
                  className: "",   // 🔥 removes default leaflet-icon styles
                  iconSize: [26, 26],
                  iconAnchor: [13, 13],
                })}

              >
                <Tooltip direction="top" offset={[0, -12]}>{s.name}</Tooltip>
              </Marker>
            ))
          )}


          {/* NEW: Live Metro Markers */}
          {liveMetros.map(metro => {
            const color = routeIdToColor[metro.route_id] || "#808080"; // Default gray
            const prev = prevMetrosMap[metro.trip_id];
            const isStopped = !!prev && prev.progress === metro.progress;
            return (
              <LiveMetroMarker
                key={metro.trip_id}
                metro={metro}
                color={color}
                isStopped={isStopped}
              />
            );
          })}
        </MapContainer>

        {/* CENTERED TITLE - Always visible */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-40 pointer-events-none">
          <h1 className="text-5xl md:text-6xl font-bold font-mono text-white drop-shadow-2xl tracking-tight">
            DELHI NCR TRANSPORT NETWORK
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mt-3 tracking-wider">
            Metro • Bus • Rapid Rail
          </p>
        </div>
      </div>

      {/* Global mouse tracker */}
      <div
        className="fixed inset-0 z-10 pointer-events-none"
        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      />

      {/* Hover Tooltip */}
      {hoveredRoute && <RouteTooltip route={hoveredRoute} position={mousePos} />}
    </div>
  );
};