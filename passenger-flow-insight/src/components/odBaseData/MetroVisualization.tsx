
import { MetroMap } from './MetroMaps';
import { StatsPanel } from './StatsPanel';
import { ControlsPanel } from './ControlsPanel';
import { Train, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useMetroData } from '../../hooks/useMetroData';
export default function MetroVisualization() {
  const {
    stations,
    arcs,
    stats,
    isLoading,
    error,
    filters,
    setFilters,
    globalMaxPassengers,
    globalMinPassengers,
    availableMonths,
  } = useMetroData();

  /* -------------------------------------------------
     ORIGIN STATIONS ONLY (from API arcs)
     ------------------------------------------------- */
  const originStationNames = useMemo(() => {
    const set = new Set<string>();
    arcs.forEach(a => set.add(a.origin.name));
    return Array.from(set).sort();
  }, [arcs]);

  /* -------------------------------------------------
     ERROR STATE
     ------------------------------------------------- */
  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <div className="text-destructive text-lg font-medium">
            Error Loading Data
          </div>
          <div className="text-muted-foreground">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex bg-background overflow-hidden">

      {/* ================= SIDEBAR ================= */}
      {/* <div className="w-50 h-full flex flex-col border-r border-border bg-card/50 backdrop-blur-sm overflow-visible"> */}
      <div className="w-50 min-w-[20rem] max-w-[20rem] 
     h-full flex flex-col 
     border-r border-border 
     bg-card/50 backdrop-blur-sm 
     overflow-visible flex-shrink-0">

        {/* Header */}
        {/* <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Train className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Delhi Metro</h1>
              <p className="text-xs text-muted-foreground">
                Passenger Flow Visualization
              </p>
            </div>
          </div>
        </div> */}

        {/* Controls */}
        <div className="p-4 border-b border-border overflow-visible">
          <ControlsPanel
            filters={filters}
            onFiltersChange={setFilters}
            stationNames={originStationNames}
            globalMin={globalMinPassengers}
            globalMax={globalMaxPassengers}
            availableMonths={availableMonths}
          />
        </div>

        {/* Stats */}
        <div className="flex-1 overflow-y-auto p-4">
          <StatsPanel stats={stats} isLoading={isLoading} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading stations...
              </span>
            ) : (
              <span>
                {stations.length} stations • {arcs.length} OD pairs
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ================= MAP ================= */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="text-sm text-muted-foreground">
                Loading metro data...
              </div>
            </div>
          </div>
        )}

        <MetroMap
          stations={stations}
          arcs={arcs}
          selectedStation={filters.selectedStation}
          minPassengers={filters.minPassengers}
          flowDirection={filters.flowDirection}
          onStationSelect={(name) =>
            setFilters({ ...filters, selectedStation: name })
          }
          animationSpeed={filters.animationSpeed}
          isPlaying={filters.isPlaying}
        />
      </div>
    </div >
  );
}
