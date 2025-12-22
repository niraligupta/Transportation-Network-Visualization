// RouteTooltip.tsx
import { Train, Bus, Zap, Clock, MapPin } from "lucide-react";
import { ProcessedRoute } from "@/types/transport";

interface RouteTooltipProps {
  route: ProcessedRoute;
  position: { x: number; y: number };
}

export const RouteTooltip = ({ route, position }: RouteTooltipProps) => {
  // Safely infer type from color/name
  const inferredType =
    route.color?.toLowerCase().includes("rapid") || route.name?.toLowerCase().includes("rapid")
      ? "rapid"
      : route.color?.toLowerCase().includes("gray") || route.name?.toLowerCase().includes("bus")
        ? "bus"
        : "metro";

  const getIcon = () => {
    if (inferredType === "bus") return Bus;
    if (inferredType === "rapid") return Zap;
    return Train;
  };

  const Icon = getIcon();

  return (
    <div
      className="fixed pointer-events-none z-50 animate-scale-in"
      style={{
        left: position.x + 16,
        top: position.y + 16,
      }}
    >
      <div className="data-card min-w-[240px] border-l-4 shadow-2xl" style={{ borderLeftColor: route.color || "#888" }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
            style={{ backgroundColor: `${route.color || "#888"}20` }}
          >
            <Icon className="w-6 h-6" style={{ color: route.color || "#888" }} />
          </div>
          <div className="flex-1">
            <h4 className="font-mono font-bold text-foreground">
              {route.name || "Unknown Route"}
            </h4>
            <p className="text-xs text-muted-foreground">
              {inferredType.charAt(0).toUpperCase() + inferredType.slice(1)} Line
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground/70">
            <MapPin className="w-4 h-4" />
            <span>
              {route.latlonPath
                ? `${(route.latlonPath.length / 10).toFixed(0)} km approx`
                : "Length unknown"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-foreground/70">
            <div className="w-4 h-4 rounded-full border-2 border-current" />
            <span>{route.stations?.length || 0} stations</span>
          </div>

          <div className="flex items-center gap-2 text-foreground/70">
            <Clock className="w-4 h-4" />
            <span>
              {inferredType === "metro" && "Every 3–6 min"}
              {inferredType === "rapid" && "Every 2–4 min"}
              {inferredType === "bus" && "Every 10–20 min"}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-foreground/10 flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: route.color || "#888" }}
          />
          <span className="text-[11px] font-mono text-foreground/60">
            LIVE • {route.stations?.length || "?"} stops
          </span>
        </div>
      </div>
    </div>
  );
};