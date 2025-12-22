
import { useEffect, useState } from "react";
import { fetchDashboardSummary } from "@/lib/api";

export function useDashboardData(month: string, line: string) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        fetchDashboardSummary(month, line)
            .then(setData)
            .finally(() => setLoading(false));
    }, [month, line]);

    return { data, loading };
}
