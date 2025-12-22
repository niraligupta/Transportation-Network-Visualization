// src/components/map/LiveVehicleMarkers.jsx
import React, { useEffect, useRef } from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";

const vehicleIcon = (route) => new L.DivIcon({
    html: `<div style="transform: translate(-50%,-50%); border-radius:6px;padding:4px 6px;background:#fff;border:2px solid rgba(0,0,0,0.12);font-size:11px;font-weight:700">
           <span style="display:inline-block;padding:2px 6px;border-radius:4px;background:#1976D2;color:#fff">${route || ""}</span>
         </div>`,
    className: '',
    iconSize: [36, 18]
});

export default function LiveVehicleMarkers({ vehicles }) {
    // vehicles is an object vehicle_id-> {lat, lon, route, ...}
    const map = useMap();
    const refs = useRef({});

    // convert object to array
    const arr = Object.values(vehicles || {});

    return (
        <>
            {arr.map(v => {
                if (!v.lat || !v.lon) return null;
                return (
                    <Marker
                        key={v.vehicle_id}
                        position={[v.lat, v.lon]}
                        icon={vehicleIcon(v.route)}
                        rotationAngle={v.bearing || 0}
                        rotationOrigin="center"
                    >
                        <Tooltip direction="top">
                            <div style={{ fontSize: 12 }}>
                                <div><strong>{v.route} • {v.vehicle_id}</strong></div>
                                <div>{v.speed_kmph} km/h</div>
                                <div style={{ fontSize: 11, color: "#666" }}>{v.ts}</div>
                            </div>
                        </Tooltip>
                    </Marker>
                );
            })}
        </>
    );
}
