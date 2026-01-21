import { FilterState } from '@/types/metro';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Play,
  Pause,
  Search,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Shuffle,
} from 'lucide-react';
import { formatNumber } from '@/hooks/useMetroData';
import { useState, useMemo, useEffect } from 'react';

interface MonthOption {
  value: string;
  label: string;
}

interface ControlsPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  stationNames: string[];
  globalMin: number;
  globalMax: number;
  availableMonths: MonthOption[];
}

const ALL_STATIONS = 'All Stations';


//  COMPONENT
export function ControlsPanel({
  filters,
  onFiltersChange,
  stationNames,
  globalMin,
  globalMax,
  availableMonths,
}: ControlsPanelProps) {

  /* ================= STATE ================= */
  const [searchQuery, setSearchQuery] = useState(ALL_STATIONS);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [monthQuery, setMonthQuery] = useState('');
  const [showMonthSuggestions, setShowMonthSuggestions] = useState(false);

  /* ================= EFFECTS ================= */
  useEffect(() => {
    if (!filters.selectedStation) {
      setSearchQuery(ALL_STATIONS);
    }
  }, [filters.selectedStation]);

  useEffect(() => {
    if (filters.month) {
      const m = availableMonths.find(x => x.value === filters.month);
      if (m) setMonthQuery(m.label);
    }
  }, [filters.month, availableMonths]);
  const directionBtnClass = (dir: 'outbound' | 'inbound' | 'both') => `
  text-white
  bg-transparent
  hover:bg-accent
  transition-colors
  ${filters.flowDirection === dir ? 'bg-cyan-500/25' : ''}
`;

  /* ================= FILTERED LISTS ================= */
  const filteredStations = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return [ALL_STATIONS, ...stationNames]
      .filter(name => name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchQuery, stationNames]);

  const filteredMonths = useMemo(() => {
    if (!monthQuery) return availableMonths;
    return availableMonths.filter(m =>
      m.label.toLowerCase().includes(monthQuery.toLowerCase())
    );
  }, [monthQuery, availableMonths]);

  /* ================= HANDLERS ================= */
  const handleStationSelect = (station: string) => {
    onFiltersChange({
      ...filters,
      selectedStation: station === ALL_STATIONS ? null : station,
    });
    setSearchQuery(station);
    setShowSuggestions(false);
  };

  const clearStation = () => {
    onFiltersChange({ ...filters, selectedStation: null });
    setSearchQuery(ALL_STATIONS);
  };

  const togglePlay = () => {
    onFiltersChange({ ...filters, isPlaying: !filters.isPlaying });
  };

  const handleSpeedChange = (v: number[]) => {
    onFiltersChange({ ...filters, animationSpeed: v[0] });
  };

  const handleMinPassengersChange = (v: number[]) => {
    onFiltersChange({ ...filters, minPassengers: v[0] });
  };

  const handleDirectionChange = (dir: FilterState['flowDirection']) => {
    onFiltersChange({ ...filters, flowDirection: dir });
  };

  /* ================= RENDER ================= */
  return (
    <div className="space-y-6 w-full">

      {/* ================= ORIGIN STATION ================= */}
      <div className="glass-panel rounded-xl p-4 space-y-3 overflow-visible">
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Search className="w-4 h-4" />
          Origin Station
        </Label>

        <Input
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
            if (!e.target.value || e.target.value === ALL_STATIONS) {
              onFiltersChange({ ...filters, selectedStation: null });
            }
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search origin station..."
          className="pr-8 bg-black/40 text-white w-full"
        />

        {/* Suggestions (NORMAL FLOW, NO WIDTH JUMP) */}
        {showSuggestions && (
          <div
            className="
              mt-2 w-full max-w-full box-border
              bg-black/90 text-white
              rounded-lg shadow-xl
              max-h-48 overflow-y-auto
              scrollbar-thin scrollbar-thumb-cyan-500/60 scrollbar-track-transparent
            "
            style={{ scrollbarGutter: 'stable' }}
          >
            {filteredStations.map(station => (
              <button
                key={station}
                onClick={() => handleStationSelect(station)}
                className="
                  w-full px-4 py-2 text-left text-sm
                  truncate whitespace-nowrap overflow-hidden
                  hover:bg-cyan-500/10
                "
              >
                {station}
              </button>
            ))}
          </div>
        )}

        {filters.selectedStation && (

          <div className="flex gap-1 pt-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDirectionChange('outbound')}
              className={directionBtnClass('outbound')}
            >
              <ArrowUpRight className="w-3 h-3 mr-1" />
              Out
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDirectionChange('inbound')}
              className={directionBtnClass('inbound')}
            >
              <ArrowDownLeft className="w-3 h-3 mr-1" />
              In
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDirectionChange('both')}
              className={directionBtnClass('both')}
            >
              <Shuffle className="w-3 h-3 mr-1" />
              Both
            </Button>
          </div>

        )}
      </div>

      {/* ================= MONTH ================= */}
      <div className="glass-panel rounded-xl p-4 space-y-3 overflow-visible">
        <Label className="text-sm font-medium text-muted-foreground">
          📅 Month – Year
        </Label>

        <Input
          value={monthQuery}
          onChange={e => {
            setMonthQuery(e.target.value);
            setShowMonthSuggestions(true);
          }}
          onFocus={() => setShowMonthSuggestions(true)}
          onBlur={() => setTimeout(() => setShowMonthSuggestions(false), 150)}
          placeholder="Select month..."
          className="bg-black/40 text-white w-full"
        />

        {showMonthSuggestions && (
          <div
            className="
              mt-2 w-full max-w-full box-border
              bg-black/90 text-white
              rounded-lg shadow-xl
              max-h-56 overflow-y-auto
              scrollbar-thin scrollbar-thumb-cyan-500/60 scrollbar-track-transparent
            "
            style={{ scrollbarGutter: 'stable' }}
          >
            {filteredMonths.map(m => (
              <button
                key={m.value}
                onClick={() => {
                  onFiltersChange({ ...filters, month: m.value });
                  setMonthQuery(m.label);
                  setShowMonthSuggestions(false);
                }}
                className="
                  w-full px-4 py-2.5 text-left text-sm
                  truncate whitespace-nowrap overflow-hidden
                  hover:bg-cyan-500/20
                "
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ================= SLIDERS ================= */}
      <div className="glass-panel rounded-xl p-4 space-y-3">
        <Label className="text-sm text-muted-foreground">Min Passengers</Label>
        <Slider
          value={[filters.minPassengers]}
          min={globalMin}
          max={globalMax}
          onValueChange={handleMinPassengersChange}
        />
        <div className="text-xs text-right">
          {formatNumber(filters.minPassengers)}
        </div>
      </div>

      <div className="glass-panel rounded-xl p-4 flex gap-3">
        <Button size="sm" onClick={togglePlay}>
          {filters.isPlaying ? <Pause /> : <Play />}
        </Button>
        <Slider
          value={[filters.animationSpeed]}
          min={0.2}
          max={3}
          step={0.1}
          onValueChange={handleSpeedChange}
        />
      </div>
    </div>
  );
}



