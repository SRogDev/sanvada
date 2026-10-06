import { z } from "zod";
import {
  getUnderstandingStore,
  understandUser,
} from "@/application/understanding";
import { invalidBody, requireApiKey, toJson, UserIdSchema } from "../_lib";

const UnderstandSchema = z.object({ userId: UserIdSchema });

/**
 * POST /api/v1/understand — distill a user's evidence into a versioned,
 * confidence-scored claim set. This is the MODEL step of the pipeline.
 * v1 runs understand-heuristic-0.1.0 (scaffold); the fine-tuned extractor
 * registers behind the same contract later.
 */
export async function POST(req: Request) {
  const auth = requireApiKey(req);
  if (auth) return auth;

  let parsed: z.infer<typeof UnderstandSchema>;
  try {
    parsed = UnderstandSchema.parse(await req.json());
  } catch {
    return invalidBody("Invalid body: { userId }.");
  }

  const result = await understandUser(getUnderstandingStore(), parsed.userId);
  return toJson(result);
}
