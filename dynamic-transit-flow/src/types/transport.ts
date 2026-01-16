// API Response Types based on Django models

export interface MetroStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
}

export interface LiveMetro {
  trip_id: string;
  route_id: string;
  progress: number;
  current_lat: number;
  current_lon: number;
  from_stop: string;
  to_stop: string;
  next_stop: string;
  start_time: string;
  end_time: string;
}

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


export interface BusStop {
  bus_stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
}

export interface Route {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  color: string;
  clean_name: string;
}

export interface ShapePoint {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
}

export interface RouteShapeResponse {
  route_id: string;
  shape_id: string;
  shape_path: ShapePoint[];
}

export interface RouteStopInfo {
  stop_sequence: number;
  arrival_time: string;
  departure_time: string;
  stop_name: string;
  lat: number;
  lon: number;
}

export interface RouteStopsResponse {
  route_id: string;
  stops: RouteStopInfo[];
}

// Processed types for visualization

export interface StationLatLon {
  name: string;
  lat: number;
  lon: number;
}
export interface StationSvg {
  x: number;
  y: number;
  name: string;
}

export interface ProcessedRoute {
  id: string;
  type: string;
  name: string;
  color: string;
  description: string;
  length: string;
  frequency: string;
  path: string;
  stationMarkers: StationSvg[];
  particleCount: number;
  latlonPath: [number, number][]; // array of [lat, lon] <--- ADDED
  stations: StationLatLon[];
}

// Color mapping for metro lines
export const METRO_COLORS = {
  RED: "#FF0000",
  YELLOW: "#FFD500",
  BLUE: "#1E90FF",
  GREEN: "#008000",
  VIOLET: "#9400D3",
  PINK: "#ff66b2",
  MAGENTA: "#FF00FF",
  ORANGE: "#FFA500",
  AQUA: "#00FFFF",
  GREY: "#94a3b8", // fallback
} as const;

export const BUS_COLOR = "hsl(100, 60%, 50%)";
