import { useEffect, useMemo, useState } from "react";
import { LiveMetro } from "@/types/transport";
import { transportApi } from "@/services/transportApi";

function parseTimeToDate(timeStr: string): Date {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds, 0);
}

export function useLiveMetros() {
    const [liveMetros, setLiveMetros] = useState<LiveMetro[]>([]);
    const [prevMetrosMap, setPrevMetrosMap] = useState<Record<string, LiveMetro>>({});
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Update current time every second for accurate filtering
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Filter running metros based on current system time
    const runningMetros = useMemo(() => {
        return liveMetros.filter((metro) => {
            const startDate = parseTimeToDate(metro.start_time);
            const endDate = parseTimeToDate(metro.end_time);
            // Handle potential overnight trips where end_time < start_time
            if (endDate < startDate) {
                endDate.setDate(endDate.getDate() + 1);
            }
            return currentTime >= startDate && currentTime <= endDate;
        });
    }, [liveMetros, currentTime]);

    useEffect(() => {
        const fetchLiveMetros = async () => {
            try {
                setError(null);
                // Capture previous state before fetching new data
                const prevMap = liveMetros.reduce((acc, m) => {
                    acc[m.trip_id] = m;
                    return acc;
                }, {} as Record<string, LiveMetro>);

                const data = await transportApi.getLiveMetro();
                setLiveMetros(data);
                setPrevMetrosMap(prevMap);
                setIsLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err : new Error("Failed to fetch live metros"));
                setIsLoading(false);
            }
        };

        fetchLiveMetros();
        const interval = setInterval(fetchLiveMetros, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [liveMetros]); // Dependency on liveMetros to capture prev state correctly

    return { liveMetros, runningMetros, prevMetrosMap, isLoading, error };
}