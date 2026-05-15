import { Status, StatusLabel, StatusColor } from "./types";

// Status thresholds configuration (matching Excel formula)
// =IF(score<=0.25,"Requires Intervention",IF(score<0.5,"Progressing With Difficulty",IF(score<0.75,"Progressing",IF(score<0.95,"Progressing Well",IF(score>=0.95,"Successful","")))))
const STATUS_THRESHOLDS: Array<{ max: number; label: StatusLabel; color: StatusColor }> = [
  { max: 0.25, label: "Requires Intervention", color: "red" },
  { max: 0.4999, label: "Progressing With Difficulty", color: "orange" },
  { max: 0.7499, label: "In Progress", color: "yellow" },
  { max: 0.9499, label: "Progressing Well", color: "blue" },
  { max: 1.01, label: "Successful", color: "green" },
];

/**
 * Get status from a normalized score (0-1)
 */
export function getStatus(score: number): Status {
  for (const threshold of STATUS_THRESHOLDS) {
    if (score <= threshold.max) {
      return { label: threshold.label, color: threshold.color };
    }
  }
  return STATUS_THRESHOLDS[STATUS_THRESHOLDS.length - 1];
}

/**
 * Format score as percentage string
 */
export function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Format date from timestamp
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get color classes for status
 */
export function getStatusColorClasses(color: StatusColor): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  progress: string;
} {
  const colorMap = {
    red: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      badge: "bg-red-100 text-red-800",
      progress: "bg-red-500",
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
      badge: "bg-orange-100 text-orange-800",
      progress: "bg-orange-500",
    },
    yellow: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      border: "border-yellow-200",
      badge: "bg-yellow-100 text-yellow-800",
      progress: "bg-yellow-500",
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-800",
      progress: "bg-blue-500",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      badge: "bg-green-100 text-green-800",
      progress: "bg-green-500",
    },
  };
  return colorMap[color];
}

/**
 * Get rank suffix (1st, 2nd, 3rd, etc.)
 */
export function getRankSuffix(rank: number): string {
  const j = rank % 10;
  const k = rank % 100;

  if (j === 1 && k !== 11) return `${rank}st`;
  if (j === 2 && k !== 12) return `${rank}nd`;
  if (j === 3 && k !== 13) return `${rank}rd`;
  return `${rank}th`;
}

/**
 * Classname utility for conditional classes
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
