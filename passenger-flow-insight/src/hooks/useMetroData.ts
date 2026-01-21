import { useEffect, useState, useMemo } from 'react';
import {
  FlowArc,
  Station,
  VisualizationStats,
  FilterState,
} from '@/types/metro';

/* ---------------- DEFAULT FILTERS ---------------- */

const DEFAULT_FILTERS: FilterState = {
  selectedStation: null,
  minPassengers: 0,
  animationSpeed: 1,
  isPlaying: true,
  flowDirection: 'both',
  month: null,
};

type MonthOption = {
  value: string;
  label: string;
};

const API_BASE = 'http://127.0.0.1:8000/api';

/* =================================================
   HOOK
================================================== */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
export function useMetroData() {
  const [stations, setStations] = useState<Station[]>([]);
  const [arcs, setArcs] = useState<FlowArc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);

  /* =================================================
     FETCH AVAILABLE MONTHS
  ================================================== */
  useEffect(() => {
    async function fetchMonths() {
      try {
        const res = await fetch(`${API_BASE}/od-flow/months/`);

        if (!res.ok) {
          throw new Error('Failed to load months');
        }

        const data: MonthOption[] = await res.json();
        setAvailableMonths(data);

        // auto-select latest month
        if (data.length > 0 && !filters.month) {
          setFilters(prev => ({
            ...prev,
            month: data[data.length - 1].value,
          }));
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load available months');
      }
    }

    fetchMonths();
  }, []);

  /* =================================================
     FETCH OD FLOW DATA (MONTH WISE)
  ================================================== */
  useEffect(() => {
    async function fetchData() {
      if (!filters.month) return;

      try {
        setIsLoading(true);

        const res = await fetch(
          `${API_BASE}/od-flow/?month=${filters.month}`
        );

        if (!res.ok) {
          throw new Error('Failed to load OD flow');
        }

        const data = await res.json();

        const maxPassengers = data.maxPassengers || 1;

        // normalize arcs
        const normalizedArcs: FlowArc[] = data.arcs.map((arc: FlowArc) => ({
          ...arc,
          normalizedValue: arc.value / maxPassengers,
        }));

        setArcs(normalizedArcs);

        // build stations from arcs
        const stationMap = new Map<string, Station>();
        normalizedArcs.forEach(arc => {
          stationMap.set(arc.origin.name, arc.origin);
          stationMap.set(arc.destination.name, arc.destination);
        });

        setStations(Array.from(stationMap.values()));
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load metro data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [filters.month]);

  /* =================================================
     STATS CALCULATION
  ================================================== */
  const stats: VisualizationStats = useMemo(() => {
    if (arcs.length === 0) {
      return {
        totalPassengers: 0,
        totalFlows: 0,
        topOrigins: [],
        topDestinations: [],
        topPairs: [],
      };
    }

    let totalPassengers = 0;
    const originMap = new Map<string, number>();
    const destinationMap = new Map<string, number>();

    arcs.forEach(arc => {
      totalPassengers += arc.value;

      originMap.set(
        arc.origin.name,
        (originMap.get(arc.origin.name) || 0) + arc.value
      );

      destinationMap.set(
        arc.destination.name,
        (destinationMap.get(arc.destination.name) || 0) + arc.value
      );
    });

    return {
      totalPassengers,
      totalFlows: arcs.length,

      topOrigins: Array.from(originMap.entries())
        .map(([name, totalOutbound]) => ({ name, totalOutbound }))
        .sort((a, b) => b.totalOutbound - a.totalOutbound),

      topDestinations: Array.from(destinationMap.entries())
        .map(([name, totalInbound]) => ({ name, totalInbound }))
        .sort((a, b) => b.totalInbound - a.totalInbound),

      topPairs: arcs
        .slice()
        .sort((a, b) => b.value - a.value)
        .map(a => ({
          origin: a.origin.name,
          destination: a.destination.name,
          passengers: a.value,
        })),
    };
  }, [arcs]);

  /* =================================================
     GLOBAL MIN / MAX
  ================================================== */
  const globalMaxPassengers = useMemo(() => {
    if (arcs.length === 0) return 0;
    return Math.max(...arcs.map(a => a.value));
  }, [arcs]);

  const globalMinPassengers = 0;

  /* =================================================
     RETURN
  ================================================== */
  return {
    stations,
    arcs,
    stats,
    isLoading,
    error,
    filters,
    setFilters,
    availableMonths,
    globalMinPassengers,
    globalMaxPassengers,
  };
}
