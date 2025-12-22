import { ArrowUpRight, ArrowDownRight } from "lucide-react";

/* ================= API DATA TYPE ================= */
export interface StationRanking {
  station: string;
  total_entry: number;
  total_exit: number;
  peak_hour: number;
}

interface StationRankingTableProps {
  data: StationRanking[];
  onStationClick: (station: string) => void;
  selectedStation: string;
}

/* ================= COMPONENT ================= */
export function StationRankingTable({
  data,
  onStationClick,
  selectedStation,
}: StationRankingTableProps) {

  const topStations = [...data]
    .sort(
      (a, b) =>
        b.total_entry + b.total_exit -
        (a.total_entry + a.total_exit)
    )
    .slice(0, 10);

  return (
    <div
      className="glass-card rounded-lg p-6 animate-slide-up"
      style={{ animationDelay: "400ms" }}
    >
      <h3 className="text-lg font-semibold text-foreground mb-6">
        Top 10 Busiest Stations
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground text-sm">
                Rank
              </th>
              <th className="text-left py-3 px-4 text-muted-foreground text-sm">
                Station
              </th>
              <th className="text-right py-3 px-4 text-muted-foreground text-sm">
                <span className="flex items-center justify-end gap-1">
                  <ArrowUpRight className="w-4 h-4 text-entry" />
                  Boarding
                </span>
              </th>
              <th className="text-right py-3 px-4 text-muted-foreground text-sm">
                <span className="flex items-center justify-end gap-1">
                  <ArrowDownRight className="w-4 h-4 text-accent" />
                  Alighting
                </span>
              </th>
              <th className="text-right py-3 px-4 text-muted-foreground text-sm">
                Peak Hour
              </th>
            </tr>
          </thead>

          <tbody>
            {topStations.map((row, index) => (
              <tr
                key={row.station}
                onClick={() => onStationClick(row.station)}
                className={`border-b border-border/50 cursor-pointer transition-colors
                  hover:bg-secondary/50
                  ${selectedStation === row.station ? "bg-secondary" : ""}
                `}
              >
                {/* Rank */}
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                      ${index < 3
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                      }
                    `}
                  >
                    {index + 1}
                  </span>
                </td>

                {/* Station */}
                <td className="py-3 px-4 font-medium text-foreground">
                  {row.station}
                </td>

                {/* Entry */}
                <td className="py-3 px-4 text-right text-entry font-medium">
                  {row.total_entry.toLocaleString()}
                </td>

                {/* Exit */}
                <td className="py-3 px-4 text-right text-accent font-medium">
                  {row.total_exit.toLocaleString()}
                </td>

                {/* Peak Hour */}
                <td className="py-3 px-4 text-right text-muted-foreground">
                  {String(row.peak_hour).padStart(2, "0")}:00
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
