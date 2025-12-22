import {
  MetroStop,
  BusStop,
  Route,
  RouteShapeResponse,
  RouteStopsResponse,
  MetroRoute, LiveMetro,
} from "@/types/transport";

const API_BASE_URL = "http://localhost:8000/api";

async function fetchJson<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const transportApi = {
  // Fetch all metro stops
  getMetroStops: (): Promise<MetroStop[]> => {
    return fetchJson<MetroStop[]>("/metro-stops/");
  },
  // Fetch all live metro 
  getLiveMetro: (): Promise<LiveMetro[]> => {
    return fetchJson<LiveMetro[]>("/live-metro/");
  },

  // Fetch all bus stops
  getBusStops: (): Promise<BusStop[]> => {
    return fetchJson<BusStop[]>("/bus-stops/");
  },

  // Fetch all routes
  getRoutes: (): Promise<Route[]> => {
    return fetchJson<Route[]>("/routes/");
  },
  // Fetch all  Metro routes with color 
  getMetroRoutesWithColor: (): Promise<MetroRoute[]> => {
    return fetchJson<MetroRoute[]>("/metro-routes/");
  },

  // Fetch shape for a specific route
  getRouteShape: (routeId: string): Promise<RouteShapeResponse> => {
    return fetchJson<RouteShapeResponse>(`/routes/${routeId}/shape/`);
  },

  // Fetch stops for a specific route
  getRouteStops: (routeId: string): Promise<RouteStopsResponse> => {
    return fetchJson<RouteStopsResponse>(`/routes/${routeId}/stops/`);
  },
};
