// src/hooks/useLineHeatmap.ts
import { useEffect, useState } from "react";
import { fetchLineHeatmap } from "@/lib/api";

export function useLineHeatmap(month: string) {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        fetchLineHeatmap(month).then(setData);
    }, [month]);

    return data;
}
