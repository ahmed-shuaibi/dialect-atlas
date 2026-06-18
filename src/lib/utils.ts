import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmtInt = (n: number) => n.toLocaleString("en-US");
export const fmtRho = (x: number) => (x >= 0 ? "+" : "") + x.toFixed(3);
export const fmtLrt = (x: number) => x.toFixed(2);
export const fmtTau = (x: number) => x.toFixed(3);
