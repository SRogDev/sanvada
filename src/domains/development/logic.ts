import { randomUUID } from "node:crypto";
import { ValidationError } from "@/shared/errors";
import type { UUID } from "@/shared/types";
import type {
  DevelopmentPlan,
  DevelopmentPlanItem,
  DevelopmentPlanItemStatus,
  DevelopmentPlanStatus,
  Objective,
  ObjectiveStatus,
} from "./types";

/**
 * Domain logic: development (PLAN §§14–15).
 * Plans describe developmental direction, not rigid schedules —
 * this is NOT a habit tracker.
 */

function now(): string {
  return new Date().toISOString();
}

function requireNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new ValidationError(`${field} must not be empty.`);
  return trimmed;
}

// --- Objectives (PLAN §14) ------------------------------------------------------

const OBJECTIVE_TRANSITIONS: Record<ObjectiveStatus, ObjectiveStatus[]> = {
  active: ["paused", "completed", "archived"],
  paused: ["active", "completed", "archived"],
  completed: [],
  archived: [],
};

export function createObjective(input: {
  userId: UUID;
  title: string;
  description?: string | null;
}): Objective {
  const createdAt = now();
  return {
    id: randomUUID(),
    userId: input.userId,
    title: requireNonEmpty(input.title, "title"),
    description: input.description?.trim() || null,
    status: "active",
    createdAt,
    updatedAt: createdAt,
  };
}

export function setObjectiveStatus(
  objective: Objective,
  to: ObjectiveStatus,
): Objective {
  if (!OBJECTIVE_TRANSITIONS[objective.status].includes(to)) {
    throw new ValidationError(
      `Illegal objective transition: ${objective.status} → ${to}.`,
    );
  }
  return { ...objective, status: to, updatedAt: now() };
}

// --- Development plans (PLAN §15) -------------------------------------------------

const PLAN_TRANSITIONS: Record<DevelopmentPlanStatus, DevelopmentPlanStatus[]> =
  {
    active: ["paused", "completed", "archived"],
    paused: ["active", "completed", "archived"],
    completed: [],
    archived: [],
  };

export function createDevelopmentPlan(input: {
  userId: UUID;
  title: string;
  summary?: string | null;
}): DevelopmentPlan {
  const createdAt = now();
  return {
    id: randomUUID(),
    userId: input.userId,
    title: requireNonEmpty(input.title, "title"),
    summary: input.summary?.trim() || null,
    status: "active",
    createdAt,
    updatedAt: createdAt,
  };
}

export function setPlanStatus(
  plan: DevelopmentPlan,
  to: DevelopmentPlanStatus,
): DevelopmentPlan {
  if (!PLAN_TRANSITIONS[plan.status].includes(to)) {
    throw new ValidationError(
      `Illegal plan transition: ${plan.status} → ${to}.`,
    );
  }
  return { ...plan, status: to, updatedAt: now() };
}

const ITEM_TRANSITIONS: Record<
  DevelopmentPlanItemStatus,
  DevelopmentPlanItemStatus[]
> = {
  proposed: ["active", "dropped"],
  active: ["completed", "dropped"],
  completed: [],
  dropped: [],
};

export function addPlanItem(input: {
  planId: UUID;
  objectiveId?: UUID | null;
  description: string;
  priority?: number;
}): DevelopmentPlanItem {
  const createdAt = now();
  return {
    id: randomUUID(),
    developmentPlanId: input.planId,
    objectiveId: input.objectiveId ?? null,
    description: requireNonEmpty(input.description, "description"),
    priority: input.priority ?? 0,
    status: "proposed",
    createdAt,
    updatedAt: createdAt,
  };
}

export function setPlanItemStatus(
  item: DevelopmentPlanItem,
  to: DevelopmentPlanItemStatus,
): DevelopmentPlanItem {
  if (!ITEM_TRANSITIONS[item.status].includes(to)) {
    throw new ValidationError(
      `Illegal plan-item transition: ${item.status} → ${to}.`,
    );
  }
  return { ...item, status: to, updatedAt: now() };
}
