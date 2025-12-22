// src/hooks/useTopStations.ts
import { useEffect, useState } from "react";
import { fetchTopBusiestStations } from "@/lib/api";

export function useTopStations(month: string, line: string) {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        fetchTopBusiestStations(month, line).then(setData);
    }, [month, line]);

    return data;
}
