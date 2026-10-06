import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  getUnderstandingStore,
  understandUser,
} from "@/application/understanding";
import { resolveSelectionModel } from "@/infrastructure/llm/selection-model";
import { invalidBody, requireApiKey, toJson, UserIdSchema } from "../_lib";

const CandidateSchema = z.object({
  experienceId: z.string().min(1).max(128),
  fit: z.number().min(0).max(1),
  novelty: z.number().min(0).max(1),
  risk: z.enum(["low", "medium", "high"]),
});

const SelectSchema = z.object({
  userId: UserIdSchema,
  objectiveId: z.string().min(1).max(128).optional(),
  candidates: z.array(CandidateSchema).min(1).max(50),
});

/**
 * POST /api/v1/select — rank candidate experiences/actions for a user.
 * This is the SELECT step: the user's current claim set becomes the
 * selection context, and the configured ExperienceSelectionModel
 * (heuristic by default, gateway LLM with SELECTION_MODEL=gateway,
 * fine-tuned Qwen later) returns the ranking.
 */
export async function POST(req: Request) {
  const auth = requireApiKey(req);
  if (auth) return auth;

  let parsed: z.infer<typeof SelectSchema>;
  try {
    parsed = SelectSchema.parse(await req.json());
  } catch {
    return invalidBody(
      "Invalid body: { userId, objectiveId?, candidates: [{ experienceId, fit 0-1, novelty 0-1, risk }] }, 1-50 candidates.",
    );
  }

  const store = getUnderstandingStore();
  const { claims, modelVersion: understandVersion } = await understandUser(
    store,
    parsed.userId,
  );

  // Stable snapshot id: same claim set → same context.
  const contextSnapshotId = createHash("sha256")
    .update(JSON.stringify(claims.map((c) => [c.id, c.text, c.confidence])))
    .digest("hex")
    .slice(0, 16);

  const model = resolveSelectionModel();
  const selections = await model.select(
    {
      userId: parsed.userId,
      objectiveId: parsed.objectiveId ?? "api",
      contextSnapshotId,
      agentRunId: `api-${randomUUID()}`,
    },
    parsed.candidates,
  );

  return toJson({
    userId: parsed.userId,
    understandModelVersion: understandVersion,
    selectionModelVersion: model.modelVersion,
    contextSnapshotId,
    selections,
  });
}
