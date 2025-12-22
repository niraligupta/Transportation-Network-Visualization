// src/components/map/TripMap.jsx
import React, { useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import FitMapBounds from "./FitMapBounds";
import TripPolyline from "./TripPolyline";
import TripMarkers from "./TripMarkers";
import LiveVehicleMarkers from "./LiveVehicleMarkers";
import useVehicles from "../../../hooks/useVehicles";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function TripMap({ segments }) {
    const [vehicles, status] = useVehicles({ debug: false });
    const firstSeg = segments?.[0];
    const lastSeg = segments?.[segments.length - 1];

    const start = firstSeg?.shape?.[0];
    const end = lastSeg?.shape?.[lastSeg.shape.length - 1];
    const allPoints = useMemo(() => {
        const pts = [];
        segments?.forEach((seg) => {
            seg.shape?.forEach((p) => pts.push([p[0], p[1]]));
        });
        return pts;
    }, [segments]);

    const bounds = allPoints.length ? L.latLngBounds(allPoints) : null;

    return (
        <div className="h-64 w-full mt-3 rounded-lg overflow-hidden border animate-fadeIn">
            <MapContainer bounds={bounds} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <FitMapBounds bounds={bounds} />
                <TripPolyline segments={segments} />
                <TripMarkers segments={segments} />
                <LiveVehicleMarkers vehicles={vehicles} />
            </MapContainer>
            {/* optionally show small connection status */}
            <div style={{ position: 'absolute', right: 8, bottom: 8, background: 'rgba(255,255,255,0.85)', padding: '6px 8px', borderRadius: 6, fontSize: 12 }}>
                WS: {status}
            </div>
        </div>
    );
}
