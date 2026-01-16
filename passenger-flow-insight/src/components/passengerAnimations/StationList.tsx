import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ApiStation, StationEntry } from "@/lib/passengerFlowApi";
import { getFlowColor, formatNumber } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StationListProps {
    stations: ApiStation[];
    currentData: StationEntry[];
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
    const stationDataMap = useMemo(() => {
        const map = new Map<string, StationEntry>();
        currentData.forEach((d) => map.set(d.station, d));
        return map;
    }, [currentData]);

    const sortedStations = useMemo(() => {
        return [...stations].sort((a, b) => {
            const aData = stationDataMap.get(a.name);
            const bData = stationDataMap.get(b.name);
            const aFlow = aData ? aData.entry + aData.exit : 0;
            const bFlow = bData ? bData.entry + bData.exit : 0;
            return bFlow - aFlow;
        });
    }, [stations, stationDataMap]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel p-4 h-full flex flex-col"
        >
            <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="font-display text-sm font-semibold text-primary neon-text uppercase tracking-wider">
                    Station Activity
                </h3>
                <span className="ml-auto text-xs text-muted-foreground font-medium">
                    {stations.length} stations
                </span>
            </div>

            <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-2">
                    {sortedStations.map((station, index) => {
                        const data = stationDataMap.get(station.name);
                        const entry = data?.entry ?? 0;
                        const exit = data?.exit ?? 0;
                        const total = entry + exit;

                        const intensity = maxFlow > 0 ? total / maxFlow : 0;
                        const color = getFlowColor(intensity);
                        const isSelected = selectedStation === station.id;

                        return (
                            <motion.button
                                key={station.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.02 }}
                                onClick={() => onSelectStation(isSelected ? null : station.id)}
                                className={`w-full text-left p-3 rounded-lg transition-all duration-300 ${isSelected
                                    ? "bg-primary/20 border-2 border-primary/50"
                                    : "bg-secondary/50 border border-transparent hover:bg-secondary/80 hover:border-border"
                                    }`}
                                style={{
                                    boxShadow: isSelected
                                        ? `0 0 20px ${color.replace(")", " / 0.3)").replace("hsl", "hsla")}`
                                        : "none",
                                }}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: station.line_color }}
                                        />
                                        <span className="font-medium text-sm truncate text-foreground">
                                            {station.name}
                                        </span>
                                    </div>
                                    <div
                                        className="w-3 h-3 rounded-full shrink-0 transition-transform hover:scale-125"
                                        style={{
                                            backgroundColor: color,
                                            boxShadow: `0 0 10px ${color}`,
                                        }}
                                    />
                                </div>

                                {/* Entry / Exit */}
                                <div className="flex gap-4 text-xs mb-2">
                                    <div className="flex items-center gap-1">
                                        <ArrowUpRight className="w-3 h-3 text-entry" />
                                        <span className="text-muted-foreground">Entry</span>
                                        <span className="text-entry font-medium">
                                            {formatNumber(entry)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <ArrowDownRight className="w-3 h-3 text-exit" />
                                        <span className="text-muted-foreground">Exit</span>
                                        <span className="text-exit font-medium">
                                            {formatNumber(exit)}
                                        </span>
                                    </div>
                                </div>

                                {/* Flow Bar */}
                                <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(intensity * 100, 100)}%` }}
                                        transition={{ duration: 0.5, delay: 0.6 + index * 0.02 }}
                                        className="h-full rounded-full"
                                        style={{
                                            background: `linear-gradient(90deg, hsl(145, 80%, 50%), ${color})`,
                                        }}
                                    />
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </ScrollArea>
        </motion.div>
    );
};

export default StationList;
