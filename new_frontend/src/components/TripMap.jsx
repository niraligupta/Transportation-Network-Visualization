// TripMap.jsx
import React, { useMemo, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import 'leaflet/dist/leaflet.css';

// simple icons
const makeIcon = (color) => new L.DivIcon({
    className: "custom-marker",
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
});

const ROUTE_COLORS = {
    "RED": "#D32F2F", "BLUE": "#1976D2", "GREEN": "#388E3C", "YELLOW": "#FBC02D",
    "PINK": "#C2185B", "VIOLET": "#7B1FA2", "ORANGE": "#FB8C00", "bus": "#F06292", "rail": "#42A5F5", "walk": "#66BB6A"
};

function FitBounds({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (!bounds) return;
        try {
            map.fitBounds(bounds, { padding: [40, 40] });
        } catch { }
    }, [map, bounds]);
    return null;
}

export default function TripMap({ segments = [], highlightIndex = null, onHighlightChange, draggableMarkers = false, onMarkersChange }) {
    // segments: [{mode, route, shape: [[lat, lon], ...], distance_meters}]
    const allPositions = useMemo(() => {
        const pts = [];
        segments.forEach(seg => {
            if (Array.isArray(seg.shape) && seg.shape.length) {
                seg.shape.forEach(p => pts.push([p[0], p[1]]));
            }
        });
        return pts;
    }, [segments]);

    const bounds = allPositions.length ? L.latLngBounds(allPositions) : null;

    // initial draggable markers = first and last positions
    const [startPos, setStartPos] = useState(allPositions[0] || null);
    const [endPos, setEndPos] = useState(allPositions[allPositions.length - 1] || null);

    useEffect(() => {
        setStartPos(allPositions[0] || startPos);
        setEndPos(allPositions[allPositions.length - 1] || endPos);
        // eslint-disable-next-line
    }, [JSON.stringify(allPositions)]);

    useEffect(() => {
        if (onMarkersChange && startPos && endPos) {
            onMarkersChange({ start: startPos, end: endPos });
        }
        // eslint-disable-next-line
    }, [startPos, endPos]);

    return (
        <div className="h-72 w-full mt-3 rounded overflow-hidden border">
            <MapContainer style={{ height: "100%", width: "100%" }} bounds={bounds || [[0, 0], [0, 0]]} scrollWheelZoom={true}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <FitBounds bounds={bounds} />

                {segments.map((seg, i) => {
                    const color = ROUTE_COLORS[seg.route?.toString()?.toUpperCase()] || ROUTE_COLORS[seg.mode] || "#888";
                    const isHighlighted = highlightIndex === null ? false : highlightIndex === i;
                    const weight = isHighlighted ? 7 : 4;
                    const opacity = (highlightIndex === null) ? 0.95 : (isHighlighted ? 1 : 0.25);
                    const positions = (seg.shape || []).map(p => [p[0], p[1]]);

                    return (
                        <React.Fragment key={i}>
                            {positions.length > 0 && (
                                <Polyline
                                    positions={positions}
                                    pathOptions={{ color, weight, opacity }}
                                    eventHandlers={{
                                        click: () => onHighlightChange && onHighlightChange(i)
                                    }}
                                />
                            )}
                        </React.Fragment>
                    );
                })}

                {/* Start/End draggable markers */}
                {startPos && (
                    <Marker
                        position={startPos}
                        icon={makeIcon("#2E7D32")}
                        draggable={draggableMarkers}
                        eventHandlers={{
                            dragend: (e) => {
                                const ll = e.target.getLatLng();
                                setStartPos([ll.lat, ll.lng]);
                            }
                        }}
                    >
                        <Popup>Start</Popup>
                    </Marker>
                )}

                {endPos && (
                    <Marker
                        position={endPos}
                        icon={makeIcon("#C62828")}
                        draggable={draggableMarkers}
                        eventHandlers={{
                            dragend: (e) => {
                                const ll = e.target.getLatLng();
                                setEndPos([ll.lat, ll.lng]);
                            }
                        }}
                    >
                        <Popup>End</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}
