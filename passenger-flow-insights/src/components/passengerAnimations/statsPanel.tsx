import React, { useMemo } from "react";
import { Users, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { StationEntry } from "@/lib/passengerFlowApi";

interface StatsPanelProps {
    currentData: StationEntry[];
    currentHour: number;
    loading?: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
    currentData,
    currentHour,
    loading = false,
}) => {
    /* ================= DERIVED STATS ================= */
    const {
        totalEntry,
        totalExit,
        totalFlow,
        avgPerStation,
        busiestStation,
    } = useMemo(() => {
        const entry = currentData.reduce((sum, d) => sum + d.entry, 0);
        const exit = currentData.reduce((sum, d) => sum + d.exit, 0);

        const busiest = currentData.reduce(
            (max, d) =>
                d.entry + d.exit > max.flow
                    ? { name: d.station, flow: d.entry + d.exit }
                    : max,
            { name: "N/A", flow: 0 }
        );

        return {
            totalEntry: entry,
            totalExit: exit,
            totalFlow: entry + exit,
            avgPerStation:
                currentData.length > 0
                    ? Math.round((entry + exit) / currentData.length)
                    : 0,
            busiestStation: busiest,
        };
    }, [currentData]);

    /* ================= UI ================= */
    if (loading) {
        return (
            <div className="glass-panel p-4 text-sm text-muted-foreground">
                Loading statistics…
            </div>
        );
    }

    const stats = [
        {
            label: "Total Passengers",
            value: totalFlow,
            icon: Users,
            color: "text-primary",
        },
        {
            label: "Total Entries",
            value: totalEntry,
            icon: ArrowUpRight,
            color: "text-entry",
        },
        {
            label: "Total Exits",
            value: totalExit,
            icon: ArrowDownRight,
            color: "text-accent",
        },
        {
            label: "Avg / Station",
            value: avgPerStation,
            icon: TrendingUp,
            color: "text-flow-medium",
        },
    ];

    return (
        <div className="glass-panel p-2">
            <h3 className="font-display text-lg text-primary neon-text mb-4">
                Live Statistics ({String(currentHour).padStart(2, "0")}:00)
            </h3>

            <div className="grid grid-cols-2 gap-3">
                {stats.map(({ label, value, icon: Icon, color }) => (
                    <div
                        key={label}
                        className="bg-secondary/50 rounded-lg p-3 border border-border/30"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Icon className={`w-4 h-4 ${color}`} />
                            <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                        <span className="font-display text-xl text-foreground">
                            {value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-4 p-2 bg-primary/10 rounded-lg border border-primary/30">
                <div className="text-xs text-muted-foreground mb-1">
                    Busiest Station
                </div>
                <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground truncate mr-2">
                        {busiestStation.name}
                    </span>
                    <span className="font-display text-primary neon-text">
                        {busiestStation.flow.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StatsPanel;
