import React from "react";
import { motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Clock, Gauge } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatHour } from "@/lib/utils";

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
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-panel p-7 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-display text-sm font-semibold text-primary neon-text uppercase tracking-wider">
            Time Control
          </h3>
        </div>
        <motion.span
          key={currentHour}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-2xl font-bold text-foreground"
        >
          {formatHour(currentHour)}
        </motion.span>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onHourChange((currentHour - 1 + 24) % 24)}
          className="control-button p-2"
          title="Previous Hour"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={onPlayPause}
          className={`control-button p-3 ${isPlaying ? "active" : ""}`}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => onHourChange((currentHour + 1) % 24)}
          className="control-button p-2"
          title="Next Hour"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Time Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
          <span>12AM</span>
          <span>6AM</span>
          <span>12PM</span>
          <span>6PM</span>
          <span>12AM</span>
        </div>
        <Slider
          value={[currentHour]}
          onValueChange={([value]) => onHourChange(value)}
          max={23}
          step={1}
          className="cursor-pointer"
        />
      </div>

      {/* Speed Control */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Speed</span>
          </div>
          <span className="font-display text-sm font-bold text-primary">{speed}x</span>
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
    </motion.div>
  );
};

export default TimeControl;
