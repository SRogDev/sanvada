import { describe, expect, it } from "vitest";
import { ValidationError } from "../src/shared/errors";
import {
  addPlanItem,
  createDevelopmentPlan,
  createObjective,
  setObjectiveStatus,
  setPlanItemStatus,
  setPlanStatus,
} from "../src/domains/development/logic";

const userId = "66666666-6666-4666-8666-666666666666";

describe("Objectives (PLAN §14)", () => {
  it("creates active objectives with a title", () => {
    const o = createObjective({ userId, title: "Become conversational in English" });
    expect(o.status).toBe("active");
    expect(() => createObjective({ userId, title: "  " })).toThrowError(
      ValidationError,
    );
  });

  it("transitions active ↔ paused → completed | archived", () => {
    const o = createObjective({ userId, title: "x" });
    expect(setObjectiveStatus(o, "paused").status).toBe("paused");
    expect(setObjectiveStatus(setObjectiveStatus(o, "paused"), "active").status).toBe(
      "active",
    );
    expect(setObjectiveStatus(o, "completed").status).toBe("completed");
    const done = setObjectiveStatus(o, "completed");
    expect(() => setObjectiveStatus(done, "active")).toThrowError(ValidationError);
  });
});

describe("Development plans (PLAN §15) — direction, not a habit tracker", () => {
  it("creates plans and items with proposed → active → completed | dropped", () => {
    const plan = createDevelopmentPlan({ userId, title: "Q4 growth arc" });
    const item = addPlanItem({
      planId: plan.id,
      description: "Have one deep conversation per week",
      priority: 1,
    });
    expect(item.status).toBe("proposed");
    const active = setPlanItemStatus(item, "active");
    expect(active.status).toBe("active");
    expect(setPlanItemStatus(active, "completed").status).toBe("completed");
    expect(() => setPlanItemStatus(item, "completed")).toThrowError(ValidationError);
    expect(setPlanStatus(plan, "paused").status).toBe("paused");
  });
});
