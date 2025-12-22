const API_BASE = "http://localhost:8000/api";

export async function fetchDashboardSummary(month: string, line: string) {
    const res = await fetch(
        `${API_BASE}/dashboard-summary/?month=${month}&line_code=${line}`
    );
    return res.json();
}

export async function fetchStationSummary(month: string, line: string, station: string) {
    const res = await fetch(
        `${API_BASE}/station-summary/?month=${month}&line_code=${line}&station=${station}`
    );
    return res.json();
}

export async function fetchStationHourlyFlow(month: string, line: string, station: string) {
    const res = await fetch(
        `${API_BASE}/station-hourly-flow/?month=${month}&line_code=${line}&station=${station}`
    );
    return res.json();
}

export async function fetchTopBusiestStations(month: string, line: string) {
    const res = await fetch(
        `${API_BASE}/top-busiest-stations/?month=${month}&line_code=${line}`
    );
    return res.json();
}

export async function fetchLineHeatmap(month: string) {
    const res = await fetch(
        `${API_BASE}/line-heatmap/?month=${month}`
    );
    return res.json();
}

export async function fetchFilters() {
    const res = await fetch(`${API_BASE}/month-line-station/`);
    return res.json();
}

