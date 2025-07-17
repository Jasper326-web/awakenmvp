import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility to derive the first uppercase character (e.g., for avatar fallback)
export function getUserInitials(text: string): string {
  if (!text || typeof text !== "string") return ""
  return text.trim().charAt(0).toUpperCase()
}
