import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import { ApiStation, StationEntry, MetroRoute } from "@/lib/passengerFlowApi";
import FlowCanvas from "./FlowCanvas";

/* ================= PROPS ================= */
interface Props {
    routes: MetroRoute[];
    stations: ApiStation[];
    currentData: StationEntry[];
    maxFlow: number;
    isPlaying: boolean;
}

/* ================= CANVAS OVERLAY ================= */
const CanvasOverlay: React.FC<Props> = ({
    routes,
    stations,
    currentData,
    maxFlow,
    isPlaying,
}) => {
    const map = useMap();
    const [, setUpdate] = useState(0);

    // Force re-render on map move/zoom
    useEffect(() => {
        const handleMove = () => setUpdate((u) => u + 1);
        map.on("move", handleMove);
        map.on("zoom", handleMove);
        return () => {
            map.off("move", handleMove);
            map.off("zoom", handleMove);
        };
    }, [map]);

    const leafletProject = (lat: number, lon: number) => {
        const point = map.latLngToContainerPoint([lat, lon]);
        return { x: point.x, y: point.y };
    };

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 500,
                pointerEvents: "none",
            }}
        >
            <FlowCanvas
                routes={routes}
                stations={stations}
                currentData={currentData}
                maxFlow={maxFlow}
                isPlaying={isPlaying}
                leafletProject={leafletProject}
            />
        </div>
    );
};

/* ================= MAIN MAP ================= */
const LeafletCanvasMap: React.FC<Props> = ({
    routes,
    stations,
    currentData,
    maxFlow,
    isPlaying,
}) => {
    const DELHI_CENTER: LatLngExpression = [28.6139, 77.209];

    return (
        <div className="w-full h-full relative">
            <MapContainer
                center={DELHI_CENTER}
                zoom={11}
                minZoom={9}
                maxZoom={15}
                style={{ width: "100%", height: "100%" }}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <CanvasOverlay
                    routes={routes}
                    stations={stations}
                    currentData={currentData}
                    maxFlow={maxFlow}
                    isPlaying={isPlaying}
                />
            </MapContainer>
        </div>
    );
};

export default LeafletCanvasMap;
