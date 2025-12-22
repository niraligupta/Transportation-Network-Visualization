import { useEffect, useState } from "react";
import { Activity, Users, TrendingUp, Zap } from "lucide-react";

interface StatData {
  passengers: number;
  activeTrains: number;
  avgSpeed: number;
  networkLoad: number;
}

export const DataStats = () => {
  const [stats, setStats] = useState<StatData>({
    passengers: 2845892,
    activeTrains: 312,
    avgSpeed: 34,
    networkLoad: 82,
  });

  // Simulate dynamic data changes
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        passengers: prev.passengers + Math.floor(Math.random() * 1000 - 300),
        activeTrains: Math.max(280, Math.min(350, prev.activeTrains + Math.floor(Math.random() * 6 - 3))),
        avgSpeed: Math.max(28, Math.min(42, prev.avgSpeed + (Math.random() * 2 - 1))),
        networkLoad: Math.max(65, Math.min(95, prev.networkLoad + (Math.random() * 4 - 2))),
      }));
    }, 2000);

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
      value: stats.activeTrains.toLocaleString(),
      icon: Activity,
      color: "text-secondary",
    },
    {
      label: "Avg Speed (km/h)",
      value: stats.avgSpeed.toFixed(1),
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
            DMRC • DTC • RAPID METRO
          </span>
        </div>
      </div>
    </div>
  );
};
