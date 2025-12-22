import { useEffect, useState } from "react";
import { fetchFilters } from "@/lib/api";


export function useMetroFilters() {
    const [months, setMonths] = useState<string[]>([]);
    const [lines, setLines] = useState<{ line_code: string; line_name: string }[]>([]);
    const [stationsByLine, setStationsByLine] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFilters()
            .then((res) => {
                setMonths(res.month);
                setLines(res.lines);
                setStationsByLine(res.stations_by_line);
            })
            .catch(() => setError("Failed to load filters"))
            .finally(() => setLoading(false));
    }, []);

    return { months, lines, stationsByLine, loading, error };
}
