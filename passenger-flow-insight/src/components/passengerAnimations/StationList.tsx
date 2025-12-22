import React, { useMemo } from "react";
import { ApiStation, StationEntry } from "@/lib/passengerFlowApi";
import { getFlowColor } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StationListProps {
    stations: ApiStation[];
    currentData: StationEntry[];   // already hour-filtered
    maxFlow: number;
    selectedStation: string | null;
    onSelectStation: (stationId: string | null) => void;
}

const StationList: React.FC<StationListProps> = ({
    stations,
    currentData,
    maxFlow,
    selectedStation,
    onSelectStation,
}) => {
    /* ================= STATION DATA LOOKUP ================= */
    const stationDataMap = useMemo(() => {
        const map = new Map<string, StationEntry>();
        currentData.forEach((d) => map.set(d.station, d));
        return map;
    }, [currentData]);

    /* ================= SORT BY FLOW ================= */
    const sortedStations = useMemo(() => {
        return [...stations].sort((a, b) => {
            const aData = stationDataMap.get(a.name);
            const bData = stationDataMap.get(b.name);
            const aFlow = aData ? aData.entry + aData.exit : 0;
            const bFlow = bData ? bData.entry + bData.exit : 0;
            return bFlow - aFlow;
        });
    }, [stations, stationDataMap]);

    /* ================= UI ================= */
    return (
        <div className="glass-panel p-4 h-full flex flex-col">
            <h3 className="font-display text-lg text-primary neon-text mb-4">
                Station Activity
            </h3>

            <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-2">
                    {sortedStations.map((station) => {
                        const data = stationDataMap.get(station.name);
                        const entry = data?.entry ?? 0;
                        const exit = data?.exit ?? 0;
                        const total = entry + exit;

                        const intensity = maxFlow > 0 ? total / maxFlow : 0;
                        const color = getFlowColor(intensity);
                        const isSelected = selectedStation === station.id;

                        return (
                            <button
                                key={station.id}
                                onClick={() =>
                                    onSelectStation(isSelected ? null : station.id)
                                }
                                className={`w-full text-left p-3 rounded-lg transition-all duration-300 ${isSelected
                                    ? "bg-primary/20 border border-primary/50"
                                    : "bg-secondary/50 border border-transparent hover:bg-secondary/80"
                                    }`}
                                style={{
                                    boxShadow: isSelected
                                        ? `0 0 20px ${color.replace(
                                            ")",
                                            " / 0.3)"
                                        ).replace("hsl", "hsla")}`
                                        : "none",
                                }}
                            >
                                {/* ---------- Header ---------- */}
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm truncate mr-2">
                                        {station.name}
                                    </span>
                                    <div
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{
                                            backgroundColor: color,
                                            boxShadow: `0 0 10px ${color}`,
                                        }}
                                    />
                                </div>

                                {/* ---------- Entry / Exit ---------- */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Entry</span>
                                        <span className="text-flow-low">
                                            {entry.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Exit</span>
                                        <span className="text-flow-high">
                                            {exit.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* ---------- Flow Bar ---------- */}
                                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(intensity * 100, 100)}%`,
                                            background: `linear-gradient(
                        90deg,
                        hsl(145, 80%, 50%),
                        ${color}
                      )`,
                                        }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
};

export default StationList;
