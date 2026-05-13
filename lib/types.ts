import { Id } from "@/convex/_generated/dataModel";

// Status types
export type StatusLabel =
  | "Requires Intervention"
  | "Progressing With Difficulty"
  | "In Progress"
  | "Progressing Well"
  | "Successful";

export type StatusColor = "red" | "orange" | "yellow" | "blue" | "green";

export interface Status {
  label: StatusLabel;
  color: StatusColor;
}

// Activity status
export type ActivityStatus = "not_started" | "in_progress" | "complete";

// Entity types
export interface MDA {
  _id: Id<"mdas">;
  name: string;
  abbreviation?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Reform {
  _id: Id<"reforms">;
  mdaId: Id<"mdas">;
  refNumber: number;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Activity {
  _id: Id<"activities">;
  reformId: Id<"reforms">;
  refNumber: string;
  name: string;
  description?: string;
  weight: number;
  completionLevel: number;
  status: ActivityStatus;
  lastUpdatedBy?: string;
  createdAt: number;
  updatedAt: number;
}

// Performance types
export interface ReformPerformance {
  reform: Reform;
  score: number;
  status: Status;
  activityCount: number;
  /** Activities listed under this reform but excluded from score for this MDA */
  exemptActivityCount?: number;
  completedCount: number;
  activities?: Activity[];
}

export interface MDAPerformance {
  mda: MDA;
  score: number;
  status: Status;
  reformCount: number;
  /** Reforms included in overall MDA score (may be fewer than `reformCount`, e.g. NCC: 4 & 6; GBB: 4–6) */
  scoringReformCount?: number;
  activityCount?: number;
  reforms?: ReformPerformance[];
  rank?: number;
}

export interface DashboardStats {
  totalMDAs: number;
  totalReforms: number;
  totalActivities: number;
  activityStats: {
    notStarted: number;
    inProgress: number;
    complete: number;
  };
  averageScore: number;
  overallStatus: Status;
  statusCounts: {
    requiresIntervention: number;
    progressingWithDifficulty: number;
    progressing: number;
    progressingWell: number;
    successful: number;
  };
}
