import { ZoomIn, ZoomOut, RotateCcw, Move } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const ZoomControls = ({ zoom, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) => {
  return (
    <div className="absolute bottom-6 right-6 pointer-events-auto">
      <div className="data-card flex flex-col gap-2 opacity-0 animate-fade-in" style={{ animationDelay: '1.2s' }}>
        <div className="text-[10px] font-mono text-muted-foreground text-center tracking-wider mb-1">
          ZOOM {Math.round(zoom * 100)}%
        </div>
        
        <button
          onClick={onZoomIn}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 transition-all duration-200 hover:scale-105 active:scale-95"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5 text-foreground/70" />
        </button>
        
        <button
          onClick={onZoomOut}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 transition-all duration-200 hover:scale-105 active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5 text-foreground/70" />
        </button>
        
        <div className="w-full h-px bg-foreground/10 my-1" />
        
        <button
          onClick={onReset}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 transition-all duration-200 hover:scale-105 active:scale-95"
          title="Reset View"
        >
          <RotateCcw className="w-5 h-5 text-foreground/70" />
        </button>

        <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60 mt-2">
          <Move className="w-3 h-3" />
          <span>Drag to pan</span>
        </div>
      </div>
    </div>
  );
};
