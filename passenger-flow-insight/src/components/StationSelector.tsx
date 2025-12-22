import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Train } from "lucide-react";

interface StationSelectorProps {
  stations: string[];
  selectedStation: string;
  onStationChange: (station: string) => void;
}

export function StationSelector({ stations, selectedStation, onStationChange }: StationSelectorProps) {
  return (
    <div className="flex items-center gap-3 animate-fade-in">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Train className="w-5 h-5 text-primary" />
        <span className="font-medium">Select Station:</span>
      </div>
      <Select value={selectedStation} onValueChange={onStationChange}>
        <SelectTrigger className="w-[280px] bg-card border-border text-foreground">
          <SelectValue placeholder="Choose a station" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {stations.map((station) => (
            <SelectItem 
              key={station} 
              value={station}
              className="text-foreground hover:bg-secondary focus:bg-secondary"
            >
              {station}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
