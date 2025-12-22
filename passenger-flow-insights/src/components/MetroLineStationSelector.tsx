// src/components/MetroLineStationSelector.tsx
import { useEffect, useMemo } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Train, Filter, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMetroFilters } from "@/hooks/useMetroFilters";

interface Props {
  selectedMonth: string;
  selectedLine: string;
  selectedStation: string;
  onMonthChange: (month: string) => void;
  onLineChange: (line: string) => void;
  onStationChange: (station: string) => void;
}

export function MetroLineStationSelector({
  selectedMonth,
  selectedLine,
  selectedStation,
  onMonthChange,
  onLineChange,
  onStationChange,
}: Props) {
  const { months, lines, stationsByLine, loading, error } = useMetroFilters();

  /* Auto-select first station when line changes */
  useEffect(() => {
    if (selectedLine === "all") {
      onStationChange("all");
      return;
    }

    const stations = stationsByLine[selectedLine];
    if (stations?.length) {
      onStationChange(stations[0]);
    }
  }, [selectedLine, stationsByLine]);

  const filteredStations = useMemo(() => {
    if (!selectedLine || selectedLine === "all") return [];
    return stationsByLine[selectedLine] || [];
  }, [stationsByLine, selectedLine]);

  if (loading) return <span className="text-sm">Loading filters…</span>;
  if (error) return <span className="text-sm text-red-500">{error}</span>;

  return (
    <div className="flex flex-col lg:flex-row gap-3 items-center">

      {/* Month */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        <Select value={selectedMonth} onValueChange={onMonthChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {m.replace("_", " ").toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Line */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-primary" />
        <Select value={selectedLine} onValueChange={onLineChange}>
          <SelectTrigger className="w-[220px] h-9">
            <SelectValue placeholder="Select Line" />
          </SelectTrigger>
          <SelectContent>
            {lines.map((l) => (
              <SelectItem key={l.line_code} value={l.line_code}>
                {l.line_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Station */}
      <div className="flex items-center gap-2">
        <Train className="w-4 h-4 text-primary" />
        <Select value={selectedStation} onValueChange={onStationChange}>
          <SelectTrigger className="w-[260px] h-9">
            <SelectValue placeholder="Select Station" />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[300px]">
              {filteredStations.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
