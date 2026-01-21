import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Train, Radio, Zap } from "lucide-react";

import {
    fetchPassengerFlow,
    fetchMetroRoutes,
    PassengerFlowResponse,
    StationEntry,
    MetroRoute,
} from "@/lib/passengerFlowApi";

import TimeControl from "./TimeControl";
import StationList from "./StationList";
import FlowLegend from "./FlowLegend";
import StatsPanel from "./statsPanel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import type { VisualizationMode } from "./FlowCanvas";


// Lazy load the map component to avoid SSR issues
const LeafletCanvasMap = React.lazy(() => import("./LeafletCanvasMap"));

const PassengerAnimation: React.FC = () => {
    const month = "december_2024";

    const [flowData, setFlowData] = useState<PassengerFlowResponse | null>(null);
    const [routes, setRoutes] = useState<MetroRoute[]>([]);
    const [currentHour, setCurrentHour] = useState(8);
    const [isPlaying, setIsPlaying] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [selectedStation, setSelectedStation] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<VisualizationMode>("BOARDING");

    /* ================= FETCH DATA ================= */
    useEffect(() => {
        fetchMetroRoutes().then(setRoutes).catch(console.error);
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchPassengerFlow(month)
            .then(setFlowData)
            .finally(() => setLoading(false));
    }, [month]);

    /* ================= AUTO PLAY ================= */
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            setCurrentHour((h) => (h + 1) % 24);
        }, 3000 / speed);

        return () => clearInterval(interval);
    }, [isPlaying, speed]);

    /* ================= CURRENT HOUR DATA ================= */
    const currentData = useCallback((): StationEntry[] => {
        if (!flowData) return [];
        const key = `${month}-${currentHour}`;
        return flowData.hourlyData[key] || [];
    }, [flowData, currentHour]);

    /* ================= LOADING STATE ================= */
    if (loading || !flowData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                        <Train className="w-20 h-20 text-primary mx-auto" />
                    </motion.div>
                    <div className="space-y-2">
                        <h2 className="font-display text-2xl font-bold text-primary">
                            DELHI METRO
                        </h2>
                        <p className="text-muted-foreground">
                            Loading passenger flow data...
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                </motion.div>
            </div>
        );
    }

    const hourData = currentData();

    return (
        <div className="min-h-screen bg-background p-4 lg:p-6">
            {/* Header */}
            {/* <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 lg:mb-6"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Train className="w-8 h-8 text-primary" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-flow-very-low rounded-full animate-pulse" />
                        </div>
                        <div>
                            <h1 className="font-display text-xl lg:text-2xl font-bold text-foreground">
                                DELHI METRO
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Real-time Passenger Flow Visualization
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Radio className="w-4 h-4 text-flow-very-low" />
                            <span>Live Data</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Zap className="w-4 h-4 text-primary" />
                            <span>{flowData.stations.length} Stations</span>
                        </div>
                    </div>
                </div>
            </motion.header> */}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                {/* LEFT SIDEBAR */}
                <aside className="lg:col-span-3 space-y-4 order-2 lg:order-1">
                    <TimeControl
                        currentHour={currentHour}
                        onHourChange={setCurrentHour}
                        isPlaying={isPlaying}
                        onPlayPause={() => setIsPlaying(!isPlaying)}
                        speed={speed}
                        onSpeedChange={setSpeed}
                    />

                    <FlowLegend />

                    <StatsPanel
                        currentData={hourData}
                        currentHour={currentHour}
                        loading={loading}
                    />
                </aside>

                {/* MAP + CANVAS */}
                <main className="lg:col-span-6 order-1 lg:order-2">
                    <Tabs
                        value={mode}
                        onValueChange={(value) => setMode(value as VisualizationMode)}
                        className="w-full"
                    >
                        <TabsList className="mb-4 bg-card/50 border border-border">
                            <TabsTrigger
                                value="BOARDING"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                                <ArrowUpRight className="w-4 h-4 mr-2" />
                                Boarding Passenger
                            </TabsTrigger>

                            <TabsTrigger
                                value="ALIGHTING"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                                <ArrowDownRight className="w-4 h-4 mr-2" />
                                Alighting Passenger
                            </TabsTrigger>

                            <TabsTrigger
                                value="FLOW"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                                <Activity className="w-4 h-4 mr-2" />
                                Passenger Flow
                            </TabsTrigger>


                        </TabsList>
                    </Tabs>


                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-panel relative overflow-hidden"
                        style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}
                    >
                        <React.Suspense
                            fallback={
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <Train className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
                                        <p className="text-muted-foreground">Loading map...</p>
                                    </div>
                                </div>
                            }
                        >
                            <LeafletCanvasMap
                                routes={routes}
                                stations={flowData.stations}
                                currentData={hourData}
                                maxFlow={flowData.maxFlow}
                                isPlaying={isPlaying}
                                mode={mode}
                            />

                        </React.Suspense>

                        {/* Status Badges */}
                        <div className="absolute top-4 left-4 glass-panel px-3 py-2 flex items-center gap-2 z-[600]">
                            <span className="text-xs text-muted-foreground">Stations:</span>
                            <span className="font-display text-sm font-bold text-primary">
                                {flowData.stations.length}
                            </span>
                        </div>

                        <div className="absolute top-4 right-4 glass-panel px-3 py-2 flex items-center gap-2 z-[600]">
                            <div
                                className={`w-2 h-2 rounded-full ${isPlaying ? "bg-flow-very-low animate-pulse" : "bg-flow-medium"
                                    }`}
                            />
                            <span
                                className={`font-display text-sm font-bold ${isPlaying ? "text-flow-very-low" : "text-flow-medium"
                                    }`}
                            >
                                {isPlaying ? "LIVE" : "PAUSED"}
                            </span>
                        </div>
                    </motion.div>
                </main>

                {/* RIGHT SIDEBAR */}
                <aside className="lg:col-span-3 order-3">
                    <div
                        className="h-full  overflow-y-auto pr-2"
                        style={{ maxHeight: "calc(100vh - 200px)" }}
                    >
                        <StationList
                            stations={flowData.stations}
                            currentData={hourData}
                            maxFlow={flowData.maxFlow}
                            selectedStation={selectedStation}
                            onSelectStation={setSelectedStation}
                        />
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default PassengerAnimation;

