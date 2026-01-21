
"use client";
import React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

const FlowLegend: React.FC = () => {
  const levels = [
    { label: "Very Low", color: "hsl(145, 80%, 50%)" },
    { label: "Low", color: "hsl(80, 90%, 55%)" },
    { label: "Medium", color: "hsl(50, 100%, 55%)" },
    { label: "High", color: "hsl(30, 100%, 55%)" },
    { label: "Critical", color: "hsl(0, 100%, 60%)" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-panel p-7"
    >
      <div className="flex items-center gap-2 mb-7">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="font-display text-sm font-semibold text-primary neon-text uppercase tracking-wider">
          Flow Intensity
        </h3>
      </div>

      {/* Gradient Bar */}
      <div className="relative mb-4">
        <div className="h-3 rounded-full flow-indicator" />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 font-medium">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>

      {/* Level Indicators */}
      <div className="grid grid-cols-5 gap-1.5">
        {levels.map(({ label, color }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="text-center"
          >
            <div
              className="w-5 h-5 rounded-full mx-auto mb-1.5 transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 12px ${color}, 0 0 24px ${color}40`,
              }}
            />
            <span className="text-[9px] text-muted-foreground font-medium leading-tight block">
              {label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default FlowLegend;
