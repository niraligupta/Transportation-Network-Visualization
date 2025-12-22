const API_BASE = "http://localhost:8000/api";

/* ================= STATION ================= */
export interface ApiStation {
    id: string;
    name: string;
    x: number;
    y: number;
    line: string;
    line_color: string;
}

/* ================= HOURLY DATA ================= */
export interface StationEntry {
    station: string;
    entry: number;
    exit: number;
}

/* ================= PARTICLES (CANVAS) ================= */
export interface Particle {
    id: number;
    fromStation: ApiStation;
    toStation: ApiStation;
    progress: number;
    speed: number;
    intensity: number;
    isEntry: boolean;
}

/* ================= API RESPONSE ================= */
export interface PassengerFlowResponse {
    stations: ApiStation[];
    hourlyData: Record<string, StationEntry[]>;
    maxFlow: number;
}

/* ================= FETCH ================= */
export async function fetchPassengerFlow(month: string) {
    const res = await fetch(
        `${API_BASE}/passenger-flow/?month=${month}`
    );

    if (!res.ok) {
        throw new Error("Failed to fetch passenger flow");
    }

    return (await res.json()) as PassengerFlowResponse;
}
