import { useEffect, useRef, useState, useCallback } from "react";
import { TransportLegend } from "./TransportLegend";
import { TimeDisplay } from "./TimeDisplay";
import { DataStats } from "./DataStats";
import { FlowingParticle } from "./FlowingParticle";
import { ZoomControls } from "./ZoomControls";
import { RouteTooltip } from "./RouteTooltip";

// Delhi NCR Transport routes
const routes = [
  // Red Line (Dilshad Garden - Rithala)
  {
    id: "red",
    type: "metro-red",
    name: "Red Line",
    color: "hsl(0, 80%, 50%)",
    description: "Dilshad Garden ↔ Rithala",
    length: "34.6 km",
    stations: 29,
    frequency: "4 min",
    path: "M 180 120 Q 280 140 380 130 T 580 150 T 780 140 T 980 160",
    stationMarkers: [
      { x: 180, y: 120, name: "Dilshad Garden" },
      { x: 380, y: 130, name: "Shahdara" },
      { x: 580, y: 150, name: "Kashmere Gate" },
      { x: 780, y: 140, name: "Netaji Subhash Place" },
      { x: 980, y: 160, name: "Rithala" },
    ],
    particleCount: 12,
  },
  // Yellow Line (Samaypur Badli - HUDA City Centre)
  {
    id: "yellow",
    type: "metro-yellow",
    name: "Yellow Line",
    color: "hsl(50, 100%, 50%)",
    description: "Samaypur Badli ↔ HUDA City Centre",
    length: "49.3 km",
    stations: 37,
    frequency: "3 min",
    path: "M 450 80 Q 470 180 460 280 T 480 400 T 500 520 T 520 650 T 560 750",
    stationMarkers: [
      { x: 450, y: 80, name: "Samaypur Badli" },
      { x: 460, y: 280, name: "Vishwavidyalaya" },
      { x: 480, y: 400, name: "Rajiv Chowk" },
      { x: 500, y: 520, name: "Central Secretariat" },
      { x: 520, y: 650, name: "Qutab Minar" },
      { x: 560, y: 750, name: "HUDA City Centre" },
    ],
    particleCount: 15,
  },
  // Blue Line (Dwarka Sec-21 - Noida Electronic City/Vaishali)
  {
    id: "blue",
    type: "metro-blue",
    name: "Blue Line",
    color: "hsl(210, 100%, 50%)",
    description: "Dwarka Sec-21 ↔ Noida/Vaishali",
    length: "56.6 km",
    stations: 50,
    frequency: "3 min",
    path: "M 80 380 Q 180 360 300 370 T 480 400 T 680 380 T 880 360 T 1080 400 T 1200 380",
    stationMarkers: [
      { x: 80, y: 380, name: "Dwarka Sec-21" },
      { x: 300, y: 370, name: "Janakpuri West" },
      { x: 480, y: 400, name: "Rajiv Chowk" },
      { x: 680, y: 380, name: "Mandi House" },
      { x: 880, y: 360, name: "Yamuna Bank" },
      { x: 1080, y: 400, name: "Noida Sec-18" },
    ],
    particleCount: 18,
  },
  // Green Line (Inderlok - Brigadier Hoshiar Singh)
  {
    id: "green",
    type: "metro-green",
    name: "Green Line",
    color: "hsl(140, 70%, 45%)",
    description: "Inderlok ↔ Brigadier Hoshiar Singh",
    length: "29.6 km",
    stations: 24,
    frequency: "5 min",
    path: "M 380 200 Q 320 280 280 360 T 220 500 T 180 620",
    stationMarkers: [
      { x: 380, y: 200, name: "Inderlok" },
      { x: 280, y: 360, name: "Ashok Park Main" },
      { x: 180, y: 620, name: "Brigadier Hoshiar Singh" },
    ],
    particleCount: 8,
  },
  // Violet Line (Kashmere Gate - Raja Nahar Singh)
  {
    id: "violet",
    type: "metro-violet",
    name: "Violet Line",
    color: "hsl(280, 70%, 55%)",
    description: "Kashmere Gate ↔ Raja Nahar Singh",
    length: "46.6 km",
    stations: 34,
    frequency: "4 min",
    path: "M 580 150 Q 600 250 620 350 T 680 480 T 750 600 T 850 720",
    stationMarkers: [
      { x: 580, y: 150, name: "Kashmere Gate" },
      { x: 620, y: 350, name: "ITO" },
      { x: 680, y: 480, name: "Nehru Place" },
      { x: 750, y: 600, name: "Badarpur" },
      { x: 850, y: 720, name: "Raja Nahar Singh" },
    ],
    particleCount: 10,
  },
  // Pink Line (Majlis Park - Shiv Vihar)
  {
    id: "pink",
    type: "metro-pink",
    name: "Pink Line",
    color: "hsl(330, 80%, 60%)",
    description: "Majlis Park ↔ Shiv Vihar",
    length: "59.0 km",
    stations: 38,
    frequency: "4 min",
    path: "M 300 100 Q 400 150 500 200 T 700 300 T 850 400 T 950 500 T 1000 600",
    stationMarkers: [
      { x: 300, y: 100, name: "Majlis Park" },
      { x: 500, y: 200, name: "Netaji Subhash Place" },
      { x: 700, y: 300, name: "INA" },
      { x: 850, y: 400, name: "South Ex" },
      { x: 1000, y: 600, name: "Shiv Vihar" },
    ],
    particleCount: 11,
  },
  // Magenta Line (Janakpuri West - Botanical Garden)
  {
    id: "magenta",
    type: "metro-magenta",
    name: "Magenta Line",
    color: "hsl(300, 70%, 50%)",
    description: "Janakpuri West ↔ Botanical Garden",
    length: "38.2 km",
    stations: 25,
    frequency: "5 min",
    path: "M 300 370 Q 380 420 450 480 T 580 560 T 720 620 T 900 680 T 1050 640",
    stationMarkers: [
      { x: 300, y: 370, name: "Janakpuri West" },
      { x: 450, y: 480, name: "Hauz Khas" },
      { x: 720, y: 620, name: "Okhla NSIC" },
      { x: 1050, y: 640, name: "Botanical Garden" },
    ],
    particleCount: 9,
  },
  // Orange Line (Airport Express)
  {
    id: "orange",
    type: "metro-orange",
    name: "Airport Express",
    color: "hsl(30, 100%, 50%)",
    description: "New Delhi ↔ Dwarka Sec-21",
    length: "22.7 km",
    stations: 6,
    frequency: "10 min",
    path: "M 480 420 Q 400 450 320 470 T 180 500 T 80 520",
    stationMarkers: [
      { x: 480, y: 420, name: "New Delhi" },
      { x: 320, y: 470, name: "Aerocity" },
      { x: 180, y: 500, name: "IGI Airport" },
      { x: 80, y: 520, name: "Dwarka Sec-21" },
    ],
    particleCount: 6,
  },
  // Rapid Metro Gurgaon
  {
    id: "rapid",
    type: "rapid",
    name: "Rapid Metro",
    color: "hsl(180, 70%, 50%)",
    description: "Cyber City Loop",
    length: "11.7 km",
    stations: 11,
    frequency: "6 min",
    path: "M 400 700 Q 450 680 500 700 T 600 720 T 650 750",
    stationMarkers: [
      { x: 400, y: 700, name: "Sikanderpur" },
      { x: 500, y: 700, name: "DLF Phase 3" },
      { x: 650, y: 750, name: "Sector 55-56" },
    ],
    particleCount: 5,
  },
  // DTC Bus Route 1
  {
    id: "dtc1",
    type: "bus",
    name: "DTC Route 764",
    color: "hsl(100, 60%, 50%)",
    description: "Nehru Place ↔ Old Delhi",
    length: "18 km",
    stations: 25,
    frequency: "8 min",
    path: "M 680 480 Q 620 420 580 350 T 560 250 T 580 150",
    stationMarkers: [],
    particleCount: 7,
  },
  // DTC Bus Route 2
  {
    id: "dtc2",
    type: "bus",
    name: "DTC Route 423",
    color: "hsl(100, 60%, 50%)",
    description: "Dwarka ↔ ISBT Kashmere Gate",
    length: "32 km",
    stations: 40,
    frequency: "10 min",
    path: "M 100 450 Q 200 400 350 380 T 500 350 T 580 200",
    stationMarkers: [],
    particleCount: 8,
  },
];

export const TransportFlowVisualization = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredRoute, setHoveredRoute] = useState<typeof routes[0] | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.25, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.5, Math.min(3, z + delta)));
  }, []);

  const handleRouteHover = useCallback((route: typeof routes[0] | null) => {
    setHoveredRoute(route);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-background"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-gradient-glow-primary opacity-50" />
      <div className="absolute inset-0 bg-gradient-glow-secondary opacity-30" />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Main SVG Canvas */}
      <svg
        ref={svgRef}
        className={`absolute inset-0 w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        viewBox="0 0 1280 800"
        preserveAspectRatio="xMidYMid slice"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'center center',
        }}
      >
        <defs>
          {/* Glow filters */}
          <filter id="glow-tube" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-particle" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Delhi NCR Map Label */}
        <text
          x="640"
          y="30"
          textAnchor="middle"
          className="fill-muted-foreground text-xs font-mono uppercase tracking-widest"
          opacity="0.5"
        >
          Delhi NCR Region
        </text>

        {/* Static route paths (base layer) */}
        <g className="routes-static" opacity={isLoaded ? 1 : 0} style={{ transition: 'opacity 1s ease-out' }}>
          {routes.map((route) => (
            <path
              key={`${route.id}-static`}
              d={route.path}
              stroke={route.color}
              strokeWidth={hoveredRoute?.id === route.id ? "6" : "3"}
              fill="none"
              opacity={hoveredRoute ? (hoveredRoute.id === route.id ? 0.8 : 0.15) : 0.3}
              className="transport-line transition-all duration-300"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => handleRouteHover(route)}
              onMouseLeave={() => handleRouteHover(null)}
            />
          ))}
        </g>

        {/* Animated flow paths (glow layer) */}
        <g className="routes-flow" opacity={isLoaded ? 1 : 0} style={{ transition: 'opacity 1.5s ease-out 0.5s' }}>
          {routes.map((route) => (
            <path
              key={`${route.id}-glow`}
              d={route.path}
              stroke={route.color}
              strokeWidth={hoveredRoute?.id === route.id ? "4" : "2"}
              fill="none"
              opacity={hoveredRoute ? (hoveredRoute.id === route.id ? 0.9 : 0.2) : 0.6}
              filter={hoveredRoute?.id === route.id ? "url(#glow-strong)" : "url(#glow-tube)"}
              className="transport-line transition-all duration-300 pointer-events-none"
            />
          ))}
        </g>

        {/* Flowing particles */}
        <g className="particles">
          {routes.map((route) =>
            Array.from({ length: route.particleCount }).map((_, i) => (
              <FlowingParticle
                key={`${route.id}-particle-${i}`}
                path={route.path}
                color={route.color}
                delay={i * (8 / route.particleCount)}
                duration={6 + Math.random() * 4}
              />
            ))
          )}
        </g>

        {/* Station markers */}
        <g className="stations" opacity={isLoaded ? 1 : 0} style={{ transition: 'opacity 2s ease-out 1s' }}>
          {routes.flatMap((route) =>
            route.stationMarkers.map((station, i) => (
              <g key={`${route.id}-station-${i}`}>
                <circle
                  cx={station.x}
                  cy={station.y}
                  r={hoveredRoute?.id === route.id ? "8" : "6"}
                  fill="hsl(var(--background))"
                  stroke={route.color}
                  strokeWidth="2"
                  className="transition-all duration-300"
                />
                <circle
                  cx={station.x}
                  cy={station.y}
                  r={hoveredRoute?.id === route.id ? "4" : "3"}
                  fill={route.color}
                  className="transition-all duration-300"
                />
                {hoveredRoute?.id === route.id && (
                  <text
                    x={station.x}
                    y={station.y - 14}
                    textAnchor="middle"
                    className="fill-foreground text-[10px] font-mono"
                    style={{ textShadow: '0 0 8px hsl(var(--background))' }}
                  >
                    {station.name}
                  </text>
                )}
              </g>
            ))
          )}
        </g>

        {/* Major interchange markers */}
        <g className="interchanges" opacity={isLoaded ? 1 : 0} style={{ transition: 'opacity 2.5s ease-out 1.5s' }}>
          {/* Rajiv Chowk */}
          <circle cx="480" cy="400" r="12" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="3" />
          <text x="480" y="380" textAnchor="middle" className="fill-foreground/60 text-[9px] font-mono">RAJIV CHOWK</text>
          
          {/* Kashmere Gate */}
          <circle cx="580" cy="150" r="10" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="3" />
          <text x="580" y="130" textAnchor="middle" className="fill-foreground/60 text-[9px] font-mono">KASHMERE GATE</text>
          
          {/* Central Secretariat */}
          <circle cx="500" cy="520" r="10" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="3" />
          <text x="500" y="545" textAnchor="middle" className="fill-foreground/60 text-[9px] font-mono">CENTRAL SECRETARIAT</text>
        </g>
      </svg>

      {/* Route Tooltip */}
      {hoveredRoute && (
        <RouteTooltip route={hoveredRoute} position={mousePos} />
      )}

      {/* Zoom Controls */}
      <ZoomControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Time Display */}
        <TimeDisplay />

        {/* Transport Legend */}
        <TransportLegend />

        {/* Data Statistics */}
        <DataStats />

        {/* Title */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center pointer-events-auto">
          <h1 className="text-2xl md:text-3xl font-mono font-semibold text-foreground/90 tracking-wider glow-text opacity-0 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            DELHI NCR TRANSPORT FLOWS
          </h1>
          <p className="text-sm text-muted-foreground mt-1 opacity-0 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            Metro • Rapid Rail • Bus Network
          </p>
        </div>
      </div>
    </div>
  );
};
