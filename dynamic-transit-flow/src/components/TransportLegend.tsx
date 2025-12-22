import { useEffect, useState } from "react";
import { Train, Bus, Zap } from "lucide-react";
import { MetroRoute, Route } from "@/types/transport";

interface LegendItem {
  id: string;
  name: string;
  color: string;
  type: "metro" | "rapid" | "bus";
}

export const TransportLegend = () => {
  const [items, setItems] = useState<LegendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLegend = async () => {
      try {
        const metroRes = await fetch("http://localhost:8000/api/metro-routes/");
        if (!metroRes.ok) throw new Error(`Metro routes failed: ${metroRes.status}`);
        const metroData: MetroRoute[] = await metroRes.json();

        const metroItems = metroData.map(m => ({
          id: m.route_id,
          name: m.name,
          color: m.color,
          type: "metro" as const,
        }));

        // Fetch bus + rapid from routes API
        let otherRes = await fetch("http://localhost:8000/api/routes/");
        if (!otherRes.ok) throw new Error(`Routes failed: ${otherRes.status}`);
        let otherJson = await otherRes.json();
        let otherRoutes: Route[] = otherJson.results || [];

        const otherItems = otherRoutes.map(r => {
          const c = r.color.toLowerCase();
          let type: "rapid" | "bus" = c.includes("rapid") ? "rapid" : "bus";

          return {
            id: r.route_id,
            name: r.clean_name,
            color: r.color,
            type,
          };
        });

        setItems([...metroItems, ...otherItems]);
      } catch (err: any) {
        console.error("Legend load error", err);
        setError(err.message || "Failed to load legend");
      } finally {
        setLoading(false);
      }
    };

    fetchLegend();
  }, []);

  const getIcon = (type: LegendItem["type"]) => {
    if (type === "bus") return Bus;
    if (type === "rapid") return Zap;
    return Train;
  };
  if (loading) {
    return (
      <div className="data-card p-3">
        <p className="text-sm text-gray-400">Loading legend...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="data-card p-3">
        <p className="text-sm text-red-400">Error loading legend:</p>
        <p className="text-xs text-red-300 mt-1">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="data-card p-3">
        <p className="text-sm text-gray-500">No routes found</p>
      </div>
    );
  }
  return (
    <div className="absolute top-6 left-6 pointer-events-auto">
      <div className="data-card p-3 space-y-2 max-h-[70vh] overflow-y-auto animate-fade-in">

        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-1">
          Delhi Transport Network
        </h3>

        {/* METRO LINES */}
        <h4 className="font-mono text-xs mt-1">Metro Lines</h4>
        {items.filter(i => i.type === "metro").map(i => (
          <div key={i.id} className="flex items-center gap-2">
            <div style={{
              width: 20,
              height: 4,
              background: i.color,
              borderRadius: 4,
            }} />
            <span className="text-sm">{i.name}</span>
          </div>
        ))}

        {/* BUS + RAPID */}
        <h4 className="font-mono text-xs mt-3">Bus & Rapid Lines</h4>
        {items.filter(i => i.type !== "metro").map((item, index) => {
          const Icon = getIcon(item.type);
          return (
            <div key={item.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{item.name}</span>
            </div>
          );
        })}

        <p className="text-[10px] text-muted-foreground mt-2">Hover routes for details</p>
      </div>
    </div>
  );
};
