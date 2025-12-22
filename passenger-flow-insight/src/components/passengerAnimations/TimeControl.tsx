import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface TimeControlProps {
  currentHour: number;
  onHourChange: (hour: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

const TimeControl: React.FC<TimeControlProps> = ({
  currentHour,
  onHourChange,
  isPlaying,
  onPlayPause,
  speed,
  onSpeedChange,
}) => {
  const formatHour = (hour: number) => {
    const h = hour % 24;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:00 ${ampm}`;
  };

  return (
    <div className="glass-panel p-2 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-primary neon-text">Time Control</h3>
        <span className="font-display text-2xl text-foreground">
          {formatHour(currentHour)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onHourChange((currentHour - 1 + 24) % 24)}
          className="control-button p-1"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={onPlayPause}
          className={`control-button p-3 ${isPlaying ? 'active' : ''}`}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={() => onHourChange((currentHour + 1) % 24)}
          className="control-button p-2"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>12 AM</span>
        </div>
        <Slider
          value={[currentHour]}
          onValueChange={([value]) => onHourChange(value)}
          max={23}
          step={1}
          className="cursor-pointer"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Animation Speed</span>
          <span className="text-primary">{speed}x</span>
        </div>
        <Slider
          value={[speed]}
          onValueChange={([value]) => onSpeedChange(value)}
          min={0.5}
          max={4}
          step={0.5}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
};

export default TimeControl;
