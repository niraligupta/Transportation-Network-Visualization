import React, { useState, useEffect, useCallback } from "react";
import { Train } from "lucide-react";

import { fetchPassengerFlow, PassengerFlowResponse, StationEntry } from "@/lib/passengerFlowApi";

import FlowCanvas from "@/components/passengerAnimations/FlowCanvas";
import TimeControl from "@/components/passengerAnimations/TimeControl";
import StationList from "@/components/passengerAnimations/StationList";
import FlowLegend from "@/components/passengerAnimations/FlowLegend";
import StatsPanel from "@/components/passengerAnimations/statsPanel";


const PassengerAnimation: React.FC = () => {
    const [flowData, setFlowData] = useState<PassengerFlowResponse | null>(null);
    const [currentHour, setCurrentHour] = useState(8);
    const [isPlaying, setIsPlaying] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [selectedStation, setSelectedStation] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const month = "december_2024"; // 🔁 later connect to selector

    /* ================= FETCH API ================= */
    useEffect(() => {
        setLoading(true);

        fetchPassengerFlow(month)
            .then(setFlowData)
            .finally(() => setLoading(false));
    }, [month]);

    /* ================= AUTO PLAY HOURS ================= */
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
    }, [flowData, currentHour, month]);

    /* ================= LOADING ================= */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <Train className="w-16 h-16 text-primary animate-pulse mx-auto" />
                        <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full animate-ping bg-primary/20" />
                    </div>
                    <p className="font-display text-xl text-primary neon-text">
                        Loading Passenger Flow…
                    </p>
                </div>
            </div>
        );
    }

    if (!flowData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-destructive">Failed to load passenger data</p>
            </div>
        );
    }

    const hourData = currentData();

    /* ================= UI ================= */
    return (
        <div className="min-h-screen p-4 lg:p-6">

            {/* ---------- MAIN LAYOUT ---------- */}
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

                {/* CANVAS */}
                <main className="lg:col-span-6 order-1 lg:order-2">
                    <div
                        className="glass-panel relative overflow-hidden animate-fade-in-up"
                        style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}
                    >
                        <FlowCanvas
                            stations={flowData.stations}
                            currentData={hourData}
                            maxFlow={flowData.maxFlow}
                            isPlaying={isPlaying}
                        />

                        <div className="absolute top-4 left-4 glass-panel px-4 py-2">
                            <span className="text-sm text-muted-foreground">Stations: </span>
                            <span className="font-display text-primary">
                                {flowData.stations.length}
                            </span>
                        </div>

                        <div className="absolute top-4 right-4 glass-panel px-4 py-2">
                            <span className="text-sm text-muted-foreground">Status: </span>
                            <span
                                className={`font-display ${isPlaying ? "text-flow-low" : "text-flow-medium"
                                    }`}
                            >
                                {isPlaying ? "LIVE" : "PAUSED"}
                            </span>
                        </div>
                    </div>
                </main>

                {/* RIGHT SIDEBAR */}
                <aside className="lg:col-span-3 order-3">
                    <div
                        className="animate-fade-in-up h-full"
                        style={{
                            animationDelay: '0.4s',
                            height: 'calc(100vh - 200px)',
                            minHeight: '500px'
                        }}
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
            </div >
        </div >
    );
};

export default PassengerAnimation;
