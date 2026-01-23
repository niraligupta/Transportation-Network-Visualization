export type FlowViewMode = "origin" | "destination" | "both";

export interface Station {
  name: string;
  lat: number;
  lng: number;
  line?: string;
  line_color?: string;
}

export interface FlowArc {
  origin: Station;
  destination: Station;
  value: number;
  normalizedValue: number;
}

export interface FilterState {
  selectedStation: string | null;
  minPassengers: number;
  animationSpeed: number;
  isPlaying: boolean;
  flowDirection: 'outbound' | 'inbound' | 'both';
  month: string | null;
}
export interface VisualizationStats {
  totalPassengers: number;
  totalFlows: number;

  topOrigins: {
    name: string;
    totalOutbound: number;
  }[];

  topDestinations: {
    name: string;
    totalInbound: number;
  }[];

  topPairs: {
    origin: string;
    destination: string;
    passengers: number;
  }[];
}

