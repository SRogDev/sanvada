import { z } from "zod";
import { getUnderstandingStore } from "@/application/understanding";
import { invalidBody, requireApiKey, toJson, UserIdSchema } from "../_lib";

const EvidenceSourceSchema = z.enum([
  "conversation",
  "experience_report",
  "assessment",
  "user_confirmation",
  "user_correction",
  "system_observation",
]);

const IngestSchema = z.object({
  userId: UserIdSchema,
  events: z
    .array(
      z.object({
        sourceType: EvidenceSourceSchema,
        content: z.string().min(1).max(4000),
        structuredData: z.record(z.string(), z.unknown()).nullable().optional(),
      }),
    )
    .min(1)
    .max(100),
});

/**
 * POST /api/v1/ingest — append user events as immutable evidence.
 * This is the INGEST step of the understanding pipeline.
 */
export async function POST(req: Request) {
  const auth = requireApiKey(req);
  if (auth) return auth;

  let parsed: z.infer<typeof IngestSchema>;
  try {
    parsed = IngestSchema.parse(await req.json());
  } catch {
    return invalidBody(
      "Invalid body: { userId, events: [{ sourceType, content, structuredData? }] }, 1-100 events.",
    );
  }

  const store = getUnderstandingStore();
  const created = await store.appendEvidence(
    parsed.events.map((e) => ({
      userId: parsed.userId,
      sourceType: e.sourceType,
      content: e.content,
      structuredData: e.structuredData ?? null,
    })),
  );

  return toJson({
    userId: parsed.userId,
    count: created.length,
    evidenceIds: created.map((c) => c.id),
  });
}
