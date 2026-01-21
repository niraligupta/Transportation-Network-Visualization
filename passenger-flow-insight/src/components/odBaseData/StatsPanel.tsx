import { VisualizationStats } from '@/types/metro';
import { formatNumber } from '@/hooks/useMetroData';
import { Users, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

interface StatsPanelProps {
  stats: VisualizationStats;
  isLoading: boolean;
}

export function StatsPanel({ stats, isLoading }: StatsPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Stats */}
      <div className="glass-panel rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <Users className="w-4 h-4" />
          <span>Overview</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-primary text-glow">
              {formatNumber(stats.totalPassengers)}
            </div>
            <div className="text-xs text-muted-foreground">Total Passengers</div>
          </div>
          <div>

          </div>
        </div>
      </div>

      {/* Top Origins */}
      <div className="glass-panel rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span>Top Origin Stations</span>
        </div>
        <div className="space-y-2 text-white">
          {stats.topOrigins.slice(0, 5).map((station, i) => (
            <div key={station.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <span className="text-sm truncate max-w-[140px]" title={station.name}>
                  {station.name}
                </span>
              </div>
              <span className="text-sm font-medium text-primary">
                {formatNumber(station.totalOutbound)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Destinations */}
      <div className="glass-panel rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <TrendingDown className="w-4 h-4 text-secondary" />
          <span>Top Destination Stations</span>
        </div>
        <div className="space-y-2 text-white">
          {stats.topDestinations.slice(0, 5).map((station, i) => (
            <div key={station.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary text-xs flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <span className="text-sm truncate max-w-[140px]" title={station.name}>
                  {station.name}
                </span>
              </div>
              <span className="text-sm font-medium text-secondary">
                {formatNumber(station.totalInbound)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top O-D Pairs */}
      <div className="glass-panel rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <ArrowRightLeft className="w-4 h-4 text-accent" />
          <span>Busiest Routes</span>
        </div>
        <div className="space-y-2">
          {stats.topPairs.slice(0, 5).map((pair, i) => (
            <div key={`${pair.origin}-${pair.destination}`} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="truncate max-w-[80px]" title={pair.origin}>
                      {pair.origin}
                    </span>
                    <span>→</span>
                    <span className="truncate max-w-[80px]" title={pair.destination}>
                      {pair.destination}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-medium text-accent">
                  {formatNumber(pair.passengers)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
