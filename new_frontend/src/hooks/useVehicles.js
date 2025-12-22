// src/hooks/useVehicles.js
import { useEffect, useState, useRef, useCallback } from "react";

function buildWsUrl() {
    // Vite env (correct way)
    const envUrl = import.meta.env.VITE_WS_URL;
    if (envUrl) return envUrl;

    // fallback — correct for localhost 8000 backend
    const loc = window.location;
    const protocol = loc.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${loc.hostname}:8000/ws/vehicles/`;
}

export default function useVehicles() {
    const [vehicles, setVehicles] = useState({});
    const [status, setStatus] = useState("idle");
    const wsUrl = buildWsUrl();

    const wsRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setStatus("open");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "vehicle.update") {
                    const v = data.payload;
                    setVehicles((old) => ({ ...old, [v.vehicle_id]: v }));
                }
            } catch (e) { }
        };

        ws.onclose = () => {
            setStatus("closed");
        };

        ws.onerror = () => {
            setStatus("error");
        };

        return () => {
            ws.close();
        };
    }, [wsUrl]);

    return [vehicles, status];
}
