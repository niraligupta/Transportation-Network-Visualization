// src/hooks/useStationData.ts
import { useEffect, useState } from "react";
import {
    fetchStationSummary,
    fetchStationHourlyFlow,
} from "@/lib/api";

export function useStationData(
    month: string,
    line: string,
    station: string
) {
    const [summary, setSummary] = useState<any>(null);
    const [hourly, setHourly] = useState<any[]>([]);

    useEffect(() => {
        if (!station || station === "all") {
            setSummary(null);
            setHourly([]);
            return;
        }

        fetchStationSummary(month, line, station).then(setSummary);
        fetchStationHourlyFlow(month, line, station).then((res) =>
            setHourly(res.data || [])
        );
    }, [month, line, station]);


    return { summary, hourly };
}
