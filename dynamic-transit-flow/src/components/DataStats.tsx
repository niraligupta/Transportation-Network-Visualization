
import { useEffect, useState } from "react";
import { Activity, Users, TrendingUp, Zap, Train } from "lucide-react";
import { useLiveMetros } from "@/hooks/useLiveMetros"; // Import the live metros hook

interface StatData {
  passengers: number;
  activeTrains: number;
  avgSpeed: number;
  networkLoad: number;
}

// Haversine formula to calculate distance in km
const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const DataStats = () => {
  const { liveMetros, prevMetrosMap, isLoading: liveLoading } = useLiveMetros();

  const [stats, setStats] = useState<StatData>({
    passengers: 4630000, // Realistic starting point (4.63M average daily)
    activeTrains: 0,
    avgSpeed: 0,
    networkLoad: 82,
  });

  useEffect(() => {
    if (liveLoading) return;

    // Calculate active trains
    const activeTrains = liveMetros.length;

    // Calculate average speed for moving trains
    let totalSpeed = 0;
    let movingCount = 0;
    const pollIntervalSec = 4; // Our poll interval

    liveMetros.forEach((metro) => {
      const prev = prevMetrosMap[metro.trip_id];
      if (prev) {
        const progressDiff = metro.progress - prev.progress;
        // Consider moving if progress changed significantly (filter noise)
        if (Math.abs(progressDiff) > 0.1) {
          const distanceKm = haversine(
            prev.current_lat,
            prev.current_lon,
            metro.current_lat,
            metro.current_lon
          );
          const timeHours = pollIntervalSec / 3600;
          const speed = distanceKm / timeHours;
          if (speed > 5 && speed < 120) { // Filter outliers
            totalSpeed += speed;
            movingCount++;
          }
        }
      }
    });

    const avgSpeed = movingCount > 0 ? totalSpeed / movingCount : 34; // Fallback realistic avg

    setStats((prev) => ({
      ...prev,
      activeTrains,
      avgSpeed: Math.round(avgSpeed),
    }));
  }, [liveMetros, prevMetrosMap, liveLoading]);

  // Simulate ridership & network load changes (realistic fluctuation)
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        passengers: Math.max(4000000, Math.min(8200000, prev.passengers + Math.floor(Math.random() * 200000 - 80000))),
        networkLoad: Math.max(70, Math.min(95, prev.networkLoad + (Math.random() * 6 - 3))),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + "M";
    }
    return num.toLocaleString();
  };

  const statItems = [
    {
      label: "Daily Ridership",
      value: formatNumber(stats.passengers),
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Active Trains",
      value: liveLoading ? "..." : stats.activeTrains.toString(),
      icon: Train, // Changed icon to Train for metro focus
      color: "text-secondary",
    },
    {
      label: "Avg Speed (km/h)",
      value: liveLoading ? "..." : stats.avgSpeed.toFixed(0),
      icon: TrendingUp,
      color: "text-tertiary",
    },
    {
      label: "Network Load",
      value: `${stats.networkLoad.toFixed(0)}%`,
      icon: Zap,
      color: "text-quaternary",
    },
  ];

  return (
    <div className="absolute bottom-6 left-6 right-24 pointer-events-auto">
      <div className="flex flex-wrap justify-start gap-4 md:gap-6">
        {statItems.map((stat, index) => (
          <div
            key={stat.label}
            className="data-card flex items-center gap-3 min-w-[180px] opacity-0 animate-fade-in"
            style={{ animationDelay: `${1.5 + index * 0.15}s` }}
          >
            <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
              <stat.icon className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                {stat.label}
              </p>
              <p className={`text-xl font-mono font-semibold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-muted-foreground font-mono">
            DMRC • DTC • RAPID METRO • LIVE DATA
          </span>
        </div>
      </div>
    </div>
  );
};
