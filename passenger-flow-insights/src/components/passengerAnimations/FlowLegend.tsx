import React from 'react';

const FlowLegend: React.FC = () => {
  return (
    <div className="glass-panel p-2">
      <h3 className="font-display text-lg text-primary neon-text mb-3">
        Flow Intensity
      </h3>

      <div className="space-y-2">
        <div className="h-3 rounded-full flow-indicator" />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>

        <div className="grid grid-cols-5 gap-2 mt-4">
          {[
            { label: 'Very Low', color: 'hsl(145, 80%, 50%)' },
            { label: 'Low', color: 'hsl(80, 90%, 55%)' },
            { label: 'Medium', color: 'hsl(50, 100%, 55%)' },
            { label: 'High', color: 'hsl(30, 100%, 55%)' },
            { label: 'Very High', color: 'hsl(0, 100%, 60%)' },
          ].map(({ label, color }) => (
            <div key={label} className="text-center">
              <div
                className="w-4 h-4 rounded-full mx-auto mb-1"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 10px ${color}`,
                }}
              />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlowLegend;
