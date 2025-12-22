import { Train, Bus, Zap } from "lucide-react";

const transportTypes = [
  { id: "metro-red", name: "Red Line", color: "hsl(0, 80%, 50%)", icon: Train },
  { id: "metro-yellow", name: "Yellow Line", color: "hsl(50, 100%, 50%)", icon: Train },
  { id: "metro-blue", name: "Blue Line", color: "hsl(210, 100%, 50%)", icon: Train },
  { id: "metro-green", name: "Green Line", color: "hsl(140, 70%, 45%)", icon: Train },
  { id: "metro-violet", name: "Violet Line", color: "hsl(280, 70%, 55%)", icon: Train },
  { id: "metro-pink", name: "Pink Line", color: "hsl(330, 80%, 60%)", icon: Train },
  { id: "metro-magenta", name: "Magenta Line", color: "hsl(300, 70%, 50%)", icon: Train },
  { id: "metro-orange", name: "Airport Express", color: "hsl(30, 100%, 50%)", icon: Train },
  { id: "rapid", name: "Rapid Metro", color: "hsl(180, 70%, 50%)", icon: Zap },
  { id: "bus", name: "DTC Bus", color: "hsl(100, 60%, 50%)", icon: Bus },
];

export const TransportLegend = () => {
  return (
    <div className="absolute top-6 left-6 pointer-events-auto">
      <div className="data-card space-y-1 opacity-0 animate-fade-in max-h-[70vh] overflow-y-auto" style={{ animationDelay: '0.8s' }}>
        <h3 className="text-xs font-mono text-muted-foreground mb-3 tracking-wider uppercase">
          Delhi NCR Network
        </h3>
        {transportTypes.map((type, index) => (
          <div
            key={type.id}
            className="legend-item opacity-0 animate-fade-in"
            style={{ animationDelay: `${1 + index * 0.08}s` }}
          >
            <div
              className="legend-dot animate-pulse-glow"
              style={{ 
                backgroundColor: type.color,
                color: type.color,
                animationDelay: `${index * 0.15}s`
              }}
            />
            <type.icon 
              className="w-4 h-4 text-muted-foreground" 
              strokeWidth={1.5}
            />
            <span className="text-sm text-foreground/80">{type.name}</span>
          </div>
        ))}
        <div className="pt-2 mt-2 border-t border-foreground/10">
          <p className="text-[10px] text-muted-foreground/60 font-mono">
            Hover routes for details
          </p>
        </div>
      </div>
    </div>
  );
};
