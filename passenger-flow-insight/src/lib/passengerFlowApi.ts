import { LINE_COLOR_MAP } from "@/lib/utils";
const API_BASE = "http://localhost:8000/api";

/* ================= STATION ================= */
// export interface ApiStation {
//     id: string;
//     name: string;
//     x: number;
//     y: number;
//     line: string;
//     line_color: string;
// }


/* ================= STATION ================= */
export interface ApiStation {
    id: string;
    name: string;
    lat: number;
    lon: number;
    line: string;
    line_color: string; // always normalized to hex
}

/* ================= HOURLY DATA ================= */
export interface StationEntry {
    station: string;
    entry: number;
    exit: number;
}

/* ================= PARTICLES ================= */
export interface Particle {
    id: number;
    routeId: string;
    path: [number, number][];
    index: number;
    progress: number;
    speed: number;
    intensity: number;
    isEntry: boolean;
}

/* ================= ROUTES ================= */
export interface MetroRoute {
    route_id: string;
    name: string;
    color: string;
    path: [number, number][];
    stations: {
        stop_id: string;
        name: string;
        lat: number;
        lon: number;
    }[];
}

/* ================= API RESPONSE ================= */
export interface PassengerFlowResponse {
    stations: ApiStation[];
    hourlyData: Record<string, StationEntry[]>;
    maxFlow: number;
}

/* ================= FETCH METRO ROUTES ================= */
export async function fetchMetroRoutes(): Promise<MetroRoute[]> {
    const res = await fetch(`${API_BASE}/metro-routes/`);

    if (!res.ok) {
        const text = await res.text();
        console.error("Metro routes API error:", text);
        throw new Error("Failed to load metro routes");
    }

    return res.json();
}

/* ================= FETCH PASSENGER FLOW ================= */
export async function fetchPassengerFlow(
    month: string
): Promise<PassengerFlowResponse> {
    const res = await fetch(
        `${API_BASE}/passenger-flow/?month=${month}`
    );

    if (!res.ok) {
        const text = await res.text();
        console.error("Passenger flow API error:", text);
        throw new Error("Failed to fetch passenger flow");
    }

    const data = (await res.json()) as PassengerFlowResponse;

    /* ✅ Normalize line colors safely */
    data.stations = data.stations.map((s) => {
        const rawColor = s.line_color;

        let resolvedColor = "#9CA3AF"; // default grey

        if (typeof rawColor === "string") {
            if (rawColor.startsWith("#")) {
                resolvedColor = rawColor;
            } else {
                resolvedColor =
                    LINE_COLOR_MAP[rawColor.toLowerCase()] || "#9CA3AF";
            }
        }

        return {
            ...s,
            line_color: resolvedColor,
        };
    });

    return data;
}
