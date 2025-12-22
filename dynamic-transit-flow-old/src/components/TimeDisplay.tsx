import { useEffect, useState } from "react";

export const TimeDisplay = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const period = time.getHours() >= 12 ? "PM" : "AM";

  return (
    <div className="absolute top-6 right-6 pointer-events-auto">
      <div className="data-card opacity-0 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl md:text-5xl font-mono font-light text-foreground tracking-tight glow-text">
            {hours}:{minutes}
          </span>
          <div className="flex flex-col">
            <span className="text-lg font-mono text-primary animate-pulse-glow">
              {seconds}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {period}
            </span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground font-mono">
            {time.toLocaleDateString('en-GB', { 
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );
};
