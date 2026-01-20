const API_BASE = "http://localhost:8000/api";


export async function searchMetroStops(query) {
    if (!query?.trim()) return [];

    const res = await fetch(
        `${API_BASE}/metro-stops/?search=${encodeURIComponent(query)}`
    );

    if (!res.ok) return [];

    const data = await res.json();

    const results = data.results || data;

    return results.map(s => s.stop_name);
}

export async function fetchNearestStop(lat, lon) {
    const res = await fetch(
        `${API_BASE}/nearest-stop/?lat=${lat}&lon=${lon}`
    );

    if (!res.ok) throw new Error("Nearest stop not found");

    return await res.json();
}

export async function planTrip(payload) {
    const res = await fetch(`${API_BASE}/plan_trip/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.trips) {
        throw new Error(data.error || "No trip found");
    }

    return data.trips;
}
