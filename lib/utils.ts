import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get user initials from a name string.
 * Takes the first letter of each word, up to 2 characters.
 *
 * @param name - The user's display name
 * @param fallback - Fallback character(s) if name is empty (default: "?")
 * @returns Uppercase initials (e.g., "JD" for "John Doe")
 */
export function getInitials(name: string | undefined, fallback = "?"): string {
  if (!name || name.trim() === "") return fallback;

  return name
    .split(" ")
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
