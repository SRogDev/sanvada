import type { ISODateString, UUID } from "@/shared/types";

/**
 * Domain: development (PLAN §§14–15).
 * This is NOT a habit tracker: plans describe developmental direction,
 * not rigid schedules.
 */
export type ObjectiveStatus = "active" | "paused" | "completed" | "archived";

export interface Objective {
  id: UUID;
  userId: UUID;
  title: string;
  description: string | null;
  status: ObjectiveStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type DevelopmentPlanStatus =
  | "active"
  | "paused"
  | "completed"
  | "archived";

export interface DevelopmentPlan {
  id: UUID;
  userId: UUID;
  title: string;
  summary: string | null;
  status: DevelopmentPlanStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type DevelopmentPlanItemStatus =
  | "proposed"
  | "active"
  | "completed"
  | "dropped";

export interface DevelopmentPlanItem {
  id: UUID;
  developmentPlanId: UUID;
  objectiveId: UUID | null;
  description: string;
  priority: number;
  status: DevelopmentPlanItemStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
