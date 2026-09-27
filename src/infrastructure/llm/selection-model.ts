import { createGateway, generateObject } from "ai";
import { z } from "zod";
import {
  HeuristicSelectionModel,
  hashSelectionInput,
} from "../../application/experience-selection/model.js";
import type {
  ExperienceSelectionModel,
  SelectionCandidate,
  SelectionContext,
  SelectionResult,
} from "../../application/experience-selection/ports.js";
import { ExperienceSelectionSchema } from "../../shared/schemas/experience-selection.js";

/** Seam for structured generation — faked in tests, AI SDK in production. */
export interface StructuredGenerator {
  generateSelections(input: {
    context: SelectionContext;
    candidates: SelectionCandidate[];
  }): Promise<unknown>;
}

class AiSdkGenerator implements StructuredGenerator {
  private readonly gateway;
  constructor(private readonly modelId: string) {
    this.gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
  }

  async generateSelections(input: {
    context: SelectionContext;
    candidates: SelectionCandidate[];
  }): Promise<unknown> {
    const prompt = [
      "Rank these candidate experiences for the user's development objective.",
      "Return a JSON array ordered best-first, one object per candidate:",
      "{ experienceId (uuid), reason, targetCapability, fit (0-1), risk, confidence (0-1) }.",
      "",
      `Objective: ${input.context.objectiveId}`,
      `Candidates: ${JSON.stringify(input.candidates)}`,
    ].join("\n");
    const result = await generateObject({
      model: this.gateway(this.modelId),
      schema: z.array(ExperienceSelectionSchema),
      prompt,
    });
    return result.object;
  }
}

/**
 * Production selection model (PLAN §41): general LLM behind the
 * ExperienceSelectionModel contract. The fine-tuned Qwen registers as
 * another implementation of the same interface — nothing else changes.
 */
export class GatewaySelectionModel implements ExperienceSelectionModel {
  readonly modelVersion = "gateway-1.0.0";
  private readonly generator: StructuredGenerator;

  constructor(
    modelId = "openai/gpt-4o-mini",
    generator?: StructuredGenerator,
  ) {
    if (generator) {
      this.generator = generator;
    } else {
      if (!process.env.AI_GATEWAY_API_KEY) {
        throw new Error(
          "AI_GATEWAY_API_KEY is required for the gateway selection model.",
        );
      }
      this.generator = new AiSdkGenerator(modelId);
    }
  }

  async select(
    context: SelectionContext,
    candidates: SelectionCandidate[],
  ): Promise<SelectionResult[]> {
    const inputHash = hashSelectionInput(context, candidates);
    const raw = await this.generator.generateSelections({
      context,
      candidates,
    });
    // Never trust raw LLM JSON: validate before it becomes a recommendation.
    const selections = z.array(ExperienceSelectionSchema).parse(raw);
    const known = new Set(candidates.map((c) => c.experienceId));
    const results: SelectionResult[] = selections.map((s) => {
      if (!known.has(s.experienceId)) {
        throw new Error(
          `Selection model returned unknown experience id: ${s.experienceId}`,
        );
      }
      return {
        experienceId: s.experienceId,
        score: s.fit,
        rationale: s.reason,
        modelVersion: this.modelVersion,
        inputHash,
      };
    });
    results.sort((a, b) => b.score - a.score);
    return results;
  }
}

/** The app never constructs a selection model directly — it resolves one. */
export function resolveSelectionModel(
  generator?: StructuredGenerator,
): ExperienceSelectionModel {
  const which = process.env.SELECTION_MODEL;
  if (which === "gateway") {
    return new GatewaySelectionModel(
      process.env.SELECTION_MODEL_ID ?? "openai/gpt-4o-mini",
      generator,
    );
  }
  // "qwen-ft-1" (fine-tuned) registers here in a later iteration.
  return new HeuristicSelectionModel();
}
