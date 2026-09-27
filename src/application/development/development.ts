import {
  createReport,
  finishAttempt,
  proposeRecommendation,
  resolveRecommendation,
  startAttempt,
} from "../../domains/experiences/logic";
import type {
  ExperienceAttempt,
  ExperienceRecommendation,
  ExperienceReport,
} from "../../domains/experiences/types";
import type {
  CompleteAttemptInput,
  DevelopmentDeps,
  RecommendInput,
} from "./ports";

/** Development agent (PLAN §31). Not a habit tracker: depth over streaks. */
export class DevelopmentAgent {
  constructor(private readonly deps: DevelopmentDeps) {}

  /** Generate experience recommendations for an active objective. */
  async recommendForObjective(
    input: RecommendInput,
  ): Promise<ExperienceRecommendation[]> {
    const objectives = await this.deps.listActiveObjectives(input.userId);
    const objective = objectives.find((o) => o.id === input.objectiveId);
    if (!objective)
      throw new Error(`Objective ${input.objectiveId} not found.`);
    const candidates = await this.deps.candidateExperiences(objective);
    const recommendations: ExperienceRecommendation[] = [];
    for (const c of candidates) {
      const rec = proposeRecommendation({
        userId: input.userId,
        experienceId: c.experienceId,
        agentRunId: input.agentRunId,
        contextSnapshotId: input.contextSnapshotId,
        reason: c.reason,
        fit: c.fit,
        risk: c.risk,
        confidence: c.fit,
      });
      await this.deps.persistRecommendation(rec);
      recommendations.push(rec);
    }
    return recommendations;
  }

  /** Accept a recommendation → resolution + attempt start. */
  async acceptRecommendation(input: {
    recommendationId: string;
  }): Promise<ExperienceAttempt> {
    const rec = await this.requireRecommendation(input.recommendationId);
    const accepted = resolveRecommendation(rec, "accepted");
    await this.deps.updateRecommendation(accepted);
    const attempt = startAttempt({
      userId: accepted.userId,
      experienceId: accepted.experienceId,
      recommendationId: accepted.id,
    });
    await this.deps.persistAttempt(attempt);
    return attempt;
  }

  /** Complete (or abandon) an attempt → report synthesis → evidence. */
  async completeAttempt(
    input: CompleteAttemptInput,
  ): Promise<ExperienceReport> {
    const attempt = await this.requireAttempt(input.attemptId);
    const finished = finishAttempt(attempt, input.outcome);
    await this.deps.updateAttempt(finished);
    if (input.outcome !== "completed") {
      // Abandoned attempts produce no report (domain invariant).
      return this.emptyReport(finished);
    }
    const content = await this.deps.synthesizeReportText(
      finished,
      input.reflection,
    );
    const report = createReport({
      attempt: finished,
      content,
      structuredReflection: input.reflection ?? null,
    });
    await this.deps.persistReport(report);
    await this.deps.submitEvidence(finished.userId, report.content);
    return report;
  }

  /** Ask the companion/safety loop to review an attempt with the user. */
  async requestReview(input: { attemptId: string }): Promise<void> {
    await this.requireAttempt(input.attemptId);
    await this.deps.recordReviewRequest(input.attemptId);
  }

  private emptyReport(attempt: ExperienceAttempt): ExperienceReport {
    return {
      id: `abandoned-${attempt.id}`,
      attemptId: attempt.id,
      content: "",
      structuredReflection: null,
      createdAt: new Date().toISOString(),
    };
  }

  private async requireRecommendation(
    id: string,
  ): Promise<ExperienceRecommendation> {
    const rec = await this.deps.getRecommendation(id);
    if (!rec) throw new Error(`Recommendation ${id} not found.`);
    return rec;
  }

  private async requireAttempt(id: string): Promise<ExperienceAttempt> {
    const attempt = await this.deps.getAttempt(id);
    if (!attempt) throw new Error(`Attempt ${id} not found.`);
    return attempt;
  }
}
