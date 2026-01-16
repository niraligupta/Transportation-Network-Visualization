import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";

/* ================= API TYPE ================= */
interface HeatmapRow {
  line: string;
  line_color: string;
  hour: number;
  entry: number;
  exit: number;
}


interface PassengerHeatmapProps {
  data: HeatmapRow[];
  selectedStation?: string;
  onStationClick?: (line: string) => void;
  theme?: string;
}

/* ================= COMPONENT ================= */
export function PassengerHeatmap({
  data,
  onStationClick,
  selectedStation,
  theme,
}: PassengerHeatmapProps) {

  /* -------- Build Line × Hour Matrix -------- */
  const heatmapData = useMemo(() => {
    const result: Record<string, Record<number, number>> = {};

    data.forEach((row) => {
      if (!result[row.line_color]) {
        result[row.line_color] = {};
        for (let h = 0; h < 24; h++) result[row.line_color][h] = 0;
      }

      result[row.line_color][row.hour] += row.entry + row.exit;
    });

    return result;
  }, [data]);


  const lines = Object.keys(heatmapData);

  /* -------- Min / Max -------- */
  const { maxValue, minValue } = useMemo(() => {
    let max = 0;
    let min = Infinity;

    Object.values(heatmapData).forEach((hours) => {
      Object.values(hours).forEach((value) => {
        if (value > max) max = value;
        if (value > 0 && value < min) min = value;
      });
    });

    return { maxValue: max, minValue: min === Infinity ? 0 : min };
  }, [heatmapData]);

  /* -------- Color Scale -------- */
  const getHeatColor = (value: number) => {
    if (!value)
      return theme === "dark"
        ? "rgba(30,41,59,0.5)"
        : "rgba(241,245,249,0.8)";

    const norm = (value - minValue) / (maxValue - minValue || 1);

    if (norm < 0.2) return "rgba(59,130,246,0.45)";
    if (norm < 0.4) return "rgba(34,197,94,0.5)";
    if (norm < 0.6) return "rgba(234,179,8,0.6)";
    if (norm < 0.8) return "rgba(249,115,22,0.7)";
    return "rgba(239,68,68,0.85)";
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  /* ================= RENDER ================= */
  return (
    <Card className="glass-card p-6 animate-fade-in">
      {/* ---------- Header ---------- */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
          <Flame className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Passenger Flow Heatmap
          </h3>
          <p className="text-sm text-muted-foreground">
            Hourly passenger density across metro lines
          </p>
        </div>
        {/* Legend */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Low</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)' }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(34, 197, 94, 0.4)' }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: theme === 'dark' ? 'rgba(234, 179, 8, 0.6)' : 'rgba(234, 179, 8, 0.5)' }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: theme === 'dark' ? 'rgba(249, 115, 22, 0.7)' : 'rgba(249, 115, 22, 0.6)' }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(239, 68, 68, 0.75)' }} />
          </div>
          <span className="text-muted-foreground">High</span>
        </div>
      </div>
      {/* ---------- Heatmap ---------- */}
      <ScrollArea className="h-[500px]">
        <div className="min-w-[900px]">

          {/* Hour Header */}
          <div className="flex mb-2 sticky top-0 bg-background/95 z-10 pb-2">
            <div className="w-[180px] text-xs font-medium text-muted-foreground">
              Metro Line
            </div>
            <div className="flex-1 flex">
              {hours.map((h) => (
                <div
                  key={h}
                  className="flex-1 min-w-[28px] text-center text-xs text-muted-foreground"
                >
                  {String(h).padStart(2, "0")}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {lines.map((line) => (
            <div
              key={line}
              className={`flex items-center mb-1 rounded-lg cursor-pointer transition
                hover:bg-secondary/30
                ${selectedStation === line ? "ring-2 ring-primary bg-primary/10" : ""}
              `}
              onClick={() => onStationClick?.(line)}
            >
              <div className="w-[180px] text-xs font-medium text-foreground truncate px-2">
                {line}
              </div>

              <div className="flex-1 flex gap-0.5">
                {hours.map((h) => {
                  const value = heatmapData[line][h] || 0;
                  return (
                    <div
                      key={`${line}-${h}`}
                      className="flex-1 min-w-[28px] h-6 rounded-sm"
                      style={{ backgroundColor: getHeatColor(value) }}
                      title={`${line} • ${h}:00 → ${value.toLocaleString()}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card >
  );
}
