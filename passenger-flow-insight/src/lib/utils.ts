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

export const LINE_COLOR_MAP: Record<string, string> = {
  Yellow: "#FFD500",
  Blue: "#1E90FF",
  Red: "#FF0000",
  Green: "#4CAF50",
  Violet: "#7F3FBF",
  Magenta: "#AA00FF",
  Pink: "#ff66b2",
  RMGL: "#00FFFF",
  Grey: "#9CA3AF",
};



/* ================= FORMAT HELPERS ================= */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

export function formatHour(hour: number): string {
  const h = hour % 24;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:00 ${ampm}`;
}
