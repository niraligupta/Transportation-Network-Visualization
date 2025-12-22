import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Train,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Activity,
  Map,
} from "lucide-react";

import { StatCard } from "@/components/StatCard";
import { HourlyFlowChart } from "@/components/HourlyFlowChart";
import { BoardingAlightingChart } from "@/components/BoardingAlightingChart";
import { MetroLineStationSelector } from "@/components/MetroLineStationSelector";
import { StationRankingTable } from "@/components/StationRankingTable";
import { PassengerHeatmap } from "@/components/PassengerHeatmap";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  fetchDashboardSummary,
  fetchStationSummary,
  fetchStationHourlyFlow,
  fetchTopBusiestStations,
  fetchLineHeatmap,
} from "@/lib/api";
import PassengerAnimation from "@/components/passengerAnimations/PassengerAnimation";

const Index = () => {
  const { theme } = useTheme();

  /* ================= FILTER STATE (SOURCE OF TRUTH) ================= */
  const [month, setMonth] = useState("december_2024");
  const [line, setLine] = useState("LINE02");
  const [station, setStation] = useState<string>("");

  /* ================= DATA ================= */
  const [dashboard, setDashboard] = useState<any>(null);
  const [stationSummary, setStationSummary] = useState<any>(null);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [topStations, setTopStations] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= STATION APIs ================= */
  useEffect(() => {
    if (!station || station === "all") {
      setStationSummary(null);
      setHourlyData([]);
      return;
    }

    fetchStationSummary(month, line, station).then(setStationSummary);

    fetchStationHourlyFlow(month, line, station).then((res) =>
      setHourlyData(res.data || [])
    );
  }, [month, line, station]);

  /* ================= LINE / MONTH APIs ================= */
  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetchDashboardSummary(month, line),
      fetchTopBusiestStations(month, line),
      fetchLineHeatmap(month),
    ])
      .then(([dashboardRes, topStationsRes, heatmapRes]) => {
        setDashboard(dashboardRes);
        setTopStations(topStationsRes || []);
        setHeatmap(heatmapRes || []);
      })
      .finally(() => setLoading(false));
  }, [month, line]);

  /* ================= LOADER ================= */
  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">
            Loading passenger flow data…
          </p>
        </div>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen gradient-bg">

      {/* ---------- HEADER ---------- */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Train className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Metro Flow Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Delhi Metro Passenger Data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <MetroLineStationSelector
              selectedMonth={month}
              selectedLine={line}
              selectedStation={station}
              onMonthChange={setMonth}
              onLineChange={setLine}
              onStationChange={setStation}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>
      {/* ---------- PASSENGER ANIMATION (NEW) ---------- */}
      <PassengerAnimation />
      {/* ---------- MAIN ---------- */}
      <main className="container mx-auto px-6 py-8">

        {/* NETWORK OVERVIEW */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex gap-2 items-center">
            <Activity className="w-5 h-5" />
            Network Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Boarding" value={dashboard?.total_entry || 0} icon={<ArrowUpRight />} variant="entry" />
            <StatCard title="Total Alighting" value={dashboard?.total_exit || 0} icon={<ArrowDownRight />} variant="exit" />
            <StatCard title="Active Stations" value={dashboard?.total_stations || 0} icon={<Train />} />
            <StatCard title="Total Passengers" value={dashboard?.total_passengers || 0} icon={<Users />} />
          </div>
        </section>

        {/* STATION SUMMARY */}
        {stationSummary && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex gap-2 items-center">
              <Train className="w-5 h-5" />
              {station} Station
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Station Boarding" value={stationSummary.total_entry} icon={<ArrowUpRight />} variant="entry" />
              <StatCard title="Station Alighting" value={stationSummary.total_exit} icon={<ArrowDownRight />} variant="exit" />
              <StatCard title="Peak Hour" value={`${String(stationSummary.peak_hour).padStart(2, "0")}:00`} icon={<Clock />} />
              <StatCard title="Avg Hourly Flow" value={stationSummary.avg_hourly_flow} icon={<Activity />} />
            </div>
          </section>
        )}

        {/* CHARTS & HEATMAP */}
        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="mb-4 bg-card/50 border border-border">
            <TabsTrigger value="charts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Activity className="w-4 h-4 mr-2" />Flow Charts</TabsTrigger>
            <TabsTrigger value="heatmap" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Map className="w-4 h-4 mr-2" />Heatmap</TabsTrigger>
          </TabsList>

          <TabsContent value="charts">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HourlyFlowChart data={hourlyData} theme={theme} />
              <BoardingAlightingChart data={hourlyData} theme={theme} />
            </div>
          </TabsContent>

          <TabsContent value="heatmap">
            <PassengerHeatmap
              data={heatmap}
              selectedStation={station}
              onStationClick={setStation}
              theme={theme}
            />
          </TabsContent>
        </Tabs>

        {/* TOP STATIONS */}
        <section className="mt-8">
          <StationRankingTable
            data={topStations}
            selectedStation={station}
            onStationClick={setStation}
          />
        </section>

      </main>
    </div>
  );
};

export default Index;
