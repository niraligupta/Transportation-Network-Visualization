import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const getFlowColor = (intensity: number): string => {
  // intensity is 0-1
  if (intensity < 0.2) return 'hsl(145, 80%, 50%)'; // Green
  if (intensity < 0.4) return 'hsl(80, 90%, 55%)'; // Yellow-Green
  if (intensity < 0.6) return 'hsl(50, 100%, 55%)'; // Yellow
  if (intensity < 0.8) return 'hsl(30, 100%, 55%)'; // Orange
  return 'hsl(0, 100%, 60%)'; // Red
};

export const getGlowColor = (intensity: number): string => {
  const baseColor = getFlowColor(intensity);
  return `${baseColor.slice(0, -1)} / 0.6)`;
};