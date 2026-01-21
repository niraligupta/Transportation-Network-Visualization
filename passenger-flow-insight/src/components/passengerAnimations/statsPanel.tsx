import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, ArrowUpRight, ArrowDownRight, Crown } from "lucide-react";
import { StationEntry } from "@/lib/passengerFlowApi";
import { formatNumber, formatHour } from "@/lib/utils";

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

    if (loading) {
        return (
            <div className="glass-panel p-4">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-secondary rounded w-1/2" />
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 bg-secondary rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const stats = [
        {
            label: "Total Passengers",
            value: totalFlow,
            icon: Users,
            color: "text-primary",
            bgColor: "bg-primary/10",
        },
        {
            label: "Total Entries",
            value: totalEntry,
            icon: ArrowUpRight,
            color: "text-entry",
            bgColor: "bg-entry/10",
        },
        {
            label: "Total Exits",
            value: totalExit,
            icon: ArrowDownRight,
            color: "text-exit",
            bgColor: "bg-accent/10",
        },
        {
            label: "Avg / Station",
            value: avgPerStation,
            icon: TrendingUp,
            color: "text-flow-medium",
            bgColor: "bg-flow-medium/10",
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-8"
        >
            <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-flow-very-low animate-pulse" />
                <h3 className="font-display text-sm font-semibold text-primary neon-text uppercase tracking-wider">
                    Live Statistics
                </h3>
                <span className="ml-auto text-xs text-muted-foreground font-medium">
                    {formatHour(currentHour)}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {stats.map(({ label, value, icon: Icon, color, bgColor }, index) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className={`${bgColor} rounded-lg p-6 border border-border/30`}
                    >
                        <div className="flex items-center gap-1.5 mb-1">
                            <Icon className={`w-3.5 h-3.5 ${color}`} />
                            <span className="text-[10px] text-muted-foreground font-medium truncate">
                                {label}
                            </span>
                        </div>
                        <motion.span
                            key={value}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-display text-lg font-bold text-foreground"
                        >
                            {formatNumber(value)}
                        </motion.span>
                    </motion.div>
                ))}
            </div>

            {/* Busiest Station */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-3 p-6 bg-primary/10 rounded-lg border border-primary/30"
            >
                <div className="flex items-center gap-1.5 mb-1">
                    <Crown className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] text-muted-foreground font-medium">
                        Busiest Station
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground truncate mr-2">
                        {busiestStation.name}
                    </span>
                    <span className="font-display text-sm font-bold text-primary neon-text">
                        {formatNumber(busiestStation.flow)}
                    </span>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default StatsPanel;
