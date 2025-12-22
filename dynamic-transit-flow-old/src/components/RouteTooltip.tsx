import { Train, Bus, Zap, Clock, MapPin } from "lucide-react";

interface RouteTooltipProps {
  route: {
    id: string;
    type: string;
    name: string;
    color: string;
    description: string;
    length: string;
    stations: number;
    frequency: string;
  };
  position: { x: number; y: number };
}

export const RouteTooltip = ({ route, position }: RouteTooltipProps) => {
  const getIcon = () => {
    if (route.type.includes('metro')) return Train;
    if (route.type === 'bus') return Bus;
    if (route.type === 'rapid') return Zap;
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
      <div className="data-card min-w-[220px] border-l-4" style={{ borderLeftColor: route.color }}>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${route.color}20` }}
          >
            <Icon className="w-5 h-5" style={{ color: route.color }} />
          </div>
          <div>
            <h4 className="font-mono font-semibold text-foreground text-sm">
              {route.name}
            </h4>
            <p className="text-[10px] text-muted-foreground">
              {route.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>{route.length}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
            <span>{route.stations} stations</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Every {route.frequency}</span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-foreground/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse-glow" style={{ backgroundColor: route.color }} />
            <span className="text-[10px] text-foreground/60 font-mono">LIVE TRACKING ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
