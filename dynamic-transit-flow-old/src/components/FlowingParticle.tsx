import { useEffect, useRef, useState } from "react";

interface FlowingParticleProps {
  path: string;
  color: string;
  delay: number;
  duration: number;
}

export const FlowingParticle = ({ path, color, delay, duration }: FlowingParticleProps) => {
  const particleRef = useRef<SVGCircleElement>(null);
  const [offset, setOffset] = useState(0);
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    // Create a temporary path element to measure
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathEl.setAttribute("d", path);
    svg.appendChild(pathEl);
    document.body.appendChild(svg);
    pathRef.current = pathEl;

    const pathLength = pathEl.getTotalLength();
    let animationFrame: number;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp + delay * 1000;
      
      const elapsed = timestamp - startTime;
      const progress = (elapsed / (duration * 1000)) % 1;
      
      if (progress >= 0 && pathRef.current) {
        const point = pathRef.current.getPointAtLength(progress * pathLength);
        setOffset(progress);
        
        if (particleRef.current) {
          particleRef.current.setAttribute("cx", point.x.toString());
          particleRef.current.setAttribute("cy", point.y.toString());
          
          // Fade in/out at ends
          let opacity = 1;
          if (progress < 0.1) opacity = progress * 10;
          else if (progress > 0.9) opacity = (1 - progress) * 10;
          particleRef.current.setAttribute("opacity", opacity.toString());
        }
      }
      
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      document.body.removeChild(svg);
    };
  }, [path, delay, duration]);

  return (
    <g filter="url(#glow-particle)">
      <circle
        ref={particleRef}
        r="5"
        fill={color}
        opacity="0"
      />
      {/* Trail effect */}
      <circle
        ref={(el) => {
          if (el && particleRef.current) {
            el.setAttribute("cx", particleRef.current.getAttribute("cx") || "0");
            el.setAttribute("cy", particleRef.current.getAttribute("cy") || "0");
          }
        }}
        r="3"
        fill={color}
        opacity="0.5"
      />
    </g>
  );
};
