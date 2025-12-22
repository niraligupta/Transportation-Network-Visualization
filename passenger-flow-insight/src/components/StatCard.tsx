import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'entry' | 'exit' | 'default';
  delay?: number;
}

export function StatCard({ title, value, icon, variant = 'default', delay = 0 }: StatCardProps) {
  const variantStyles = {
    entry: 'border-l-4 border-l-entry glow-primary',
    exit: 'border-l-4 border-l-accent glow-accent',
    default: 'border-l-4 border-l-muted',
  };

  return (
    <div 
      className={`glass-card rounded-lg p-6 animate-slide-up ${variantStyles[variant]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold mt-2 text-foreground">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${variant === 'entry' ? 'bg-entry/20 text-entry' : variant === 'exit' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
