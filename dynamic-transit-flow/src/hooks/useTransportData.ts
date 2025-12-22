import { useEffect, useState } from "react";
import { ProcessedRoute, StationLatLon, StationSvg, METRO_COLORS } from "@/types/transport";


const API_BASE = "http://127.0.0.1:8000/api";

// Haversine distance for length calculation
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useTransportData() {
  const [routes, setRoutes] = useState<ProcessedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      // 1) Fetch all routes with pagination handling
      let rawRoutes: any[] = [];
      let routeUrl = `${API_BASE}/routes/`;
      while (routeUrl) {
        const routeRes = await fetch(routeUrl);
        if (!routeRes.ok) throw new Error(`Routes request failed: ${routeRes.status}`);
        const routeJson = await routeRes.json();
        rawRoutes.push(...(routeJson.results || []));
        routeUrl = routeJson.next;
      }

      // 2) For each route, concurrently fetch shape & stops (assume not paginated, but check)
      const routeFetchPromises = rawRoutes.map(async (r: any) => {
        const id = r.route_id;
        const colorKey = r.color.toUpperCase();
        const color = METRO_COLORS[colorKey] || METRO_COLORS[colorKey.replace('GRAY', 'GREY')] || (colorKey.includes('RAPID') ? METRO_COLORS['AQUA'] : "gray");
        const name = r.clean_name || r.route_short_name || id;
        const long_name = r.route_long_name || "";

        // fetch shape & stops in parallel
        const [shapeRes, stopsRes] = await Promise.all([
          fetch(`${API_BASE}/routes/${encodeURIComponent(id)}/shape/`),
          fetch(`${API_BASE}/routes/${encodeURIComponent(id)}/stops/`),
        ]);

        // handle responses
        const shapeJson = shapeRes.ok ? await shapeRes.json() : { shape_path: [] };
        const stopsJson = stopsRes.ok ? await stopsRes.json() : { stops: [] };

        return {
          id,
          name,
          color,
          long_name,
          shapePoints: shapeJson.shape_path || [],
          stops: stopsJson.stops || [],
        };
      });

      const fetchedRoutes = await Promise.all(routeFetchPromises);

      // 3) Compute global bounding box across all shape points
      const allPoints = fetchedRoutes.flatMap(fr => fr.shapePoints);
      const lats = allPoints.map((p: any) => p.shape_pt_lat);
      const lons = allPoints.map((p: any) => p.shape_pt_lon);

      // Default fallback bounding box (Delhi center) if no points
      const minLat = lats.length ? Math.min(...lats) : 28.40;
      const maxLat = lats.length ? Math.max(...lats) : 28.90;
      const minLon = lons.length ? Math.min(...lons) : 76.80;
      const maxLon = lons.length ? Math.max(...lons) : 77.50;

      // SVG canvas size used in your TransportFlowVisualization
      const SVG_W = 1280;
      const SVG_H = 800;

      // Avoid divide-by-zero
      const spanLon = maxLon - minLon || 0.0001;
      const spanLat = maxLat - minLat || 0.0001;

      // maintain aspect and use uniform scaling
      const scaleX = SVG_W / spanLon;
      const scaleY = SVG_H / spanLat;
      // use same scale for both axes to avoid distortion
      const scale = Math.min(scaleX, scaleY);

      // center offsets so map roughly centered in SVG
      const extraX = (SVG_W - spanLon * scale) / 2;
      const extraY = (SVG_H - spanLat * scale) / 2;

      const getX = (lon: number) => (lon - minLon) * scale + extraX;
      // invert Y because SVG Y grows downwards (we want north-up)
      const getY = (lat: number) => SVG_H - ((lat - minLat) * scale + extraY);

      // 4) Build processed routes
      const processed: ProcessedRoute[] = fetchedRoutes.map(fr => {
        const pts = fr.shapePoints;

        // SVG path
        const path = pts
          .map((p: any, i: number) => {
            const x = getX(p.shape_pt_lon);
            const y = getY(p.shape_pt_lat);
            return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
          })
          .join(" ");

        // Leaflet lat/lon path
        const latlonPath: [number, number][] = pts.map((p: any) => [
          p.shape_pt_lat,
          p.shape_pt_lon,
        ]);

        // Compute length
        let lengthKm = 0;
        for (let i = 0; i < latlonPath.length - 1; i++) {
          const [lat1, lon1] = latlonPath[i];
          const [lat2, lon2] = latlonPath[i + 1];
          lengthKm += haversine(lat1, lon1, lat2, lon2);
        }

        // Infer type
        const colorLower = fr.color.toLowerCase();
        const type = colorLower.includes("rapid")
          ? "rapid"
          : colorLower.includes("gray") || colorLower.includes("bus")
            ? "bus"
            : "metro";

        // Hardcode frequency (customize if API provides)
        const frequency =
          type === "metro" ? "3-5 min" : type === "rapid" ? "2-4 min" : "10-15 min";

        // stations as SVG markers and lat/lon list
        const stationMarkers: StationSvg[] = (fr.stops || []).map((s: any) => {
          // stop serializer returns lat/lon names as `lat`/`lon` or `stop_lat` etc.
          const lat = s.lat ?? s.stop_lat ?? 0;
          const lon = s.lon ?? s.stop_lon ?? 0;
          return {
            name: s.stop_name ?? s.stopName ?? "",
            x: getX(lon),
            y: getY(lat),
          };
        });

        const stations: StationLatLon[] = (fr.stops || []).map((s: any) => {
          const lat = s.lat ?? s.stop_lat ?? 0;
          const lon = s.lon ?? s.stop_lon ?? 0;
          return {
            name: s.stop_name ?? s.stopName ?? "",
            lat,
            lon,
          };
        });

        return {
          id: fr.id,
          type,
          name: fr.name,
          color: fr.color,
          description: fr.long_name,
          length: `${lengthKm.toFixed(1)} km`,
          frequency,
          path,
          stationMarkers,
          particleCount: Math.max(6, Math.round((latlonPath.length || 1) / 8)), // friendly default
          latlonPath,
          stations,
        };
      });

      setRoutes(processed);
    } catch (err: any) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error("useTransportData failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for paginated fetches (if needed for shapes/stops)
  async function fetchAllPaginated(startUrl: string): Promise<any[]> {
    let allData: any[] = [];
    let url = startUrl;
    while (url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Paginated request failed: ${res.status}`);
      const json = await res.json();
      allData.push(...(json.results || []));
      url = json.next;
    }
    return allData;
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { routes, isLoading, isError, error, refetch: fetchData };
}