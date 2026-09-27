import { z } from "zod";
import {
  applyClaimVersion,
  buildSnapshot,
  createEvidence,
  openClaim,
  transitionEvidenceRelevance,
} from "@/domains/human-context";
import { ValidationError } from "@/shared/errors";
import type { UUID } from "@/shared/types";
import type {
  ClaimInterpreterPort,
  ClaimProposal,
  ClaimWithVersions,
  HumanContextEvent,
  HumanContextStore,
  ProcessEvidenceInput,
} from "./ports";

/**
 * LLM contract at the engine boundary (PLAN §5: Zod is central to LLM contracts).
 */
const ClaimProposalSchema = z.object({
  category: z.enum([
    "personality",
    "preference",
    "value",
    "interest",
    "experience",
    "capability",
    "behavior_pattern",
    "emotional_pattern",
    "social_pattern",
    "uncertainty",
  ]),
  claimText: z.string().trim().min(1),
  status: z.enum([
    "observed",
    "inferred",
    "user_confirmed",
    "user_rejected",
    "contradicted",
    "outdated",
  ]),
  confidence: z.number().min(0).max(1),
  reason: z.string().trim().min(1),
  relatedClaimId: z.string().uuid().nullable(),
});

const now = () => new Date().toISOString();

/**
 * HumanContextEngine — application service (PLAN §24).
 *
 * Pipeline: validate evidence → relevance → retrieve claims → interpret →
 * proposals → contradiction detection → deterministic rules → persist
 * versions → snapshot when appropriate → domain events.
 *
 * Runs asynchronously: the caller never blocks the conversation on this
 * (PLAN §25).
 */
export class HumanContextEngine {
  constructor(
    private readonly store: HumanContextStore,
    private readonly interpreter: ClaimInterpreterPort,
  ) {}

  async processEvidence(
    input: ProcessEvidenceInput,
  ): Promise<HumanContextEvent[]> {
    const events: HumanContextEvent[] = [];

    // 1. validate evidence
    const evidence = createEvidence({
      userId: input.userId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      content: input.content,
      structuredData: input.structuredData,
    });
    await this.store.saveEvidence(evidence);

    // 2. determine relevance
    const assessment = await this.interpreter.assessRelevance(evidence);
    if (!assessment.relevant) {
      const irrelevant = transitionEvidenceRelevance(evidence, "irrelevant");
      await this.store.updateEvidenceRelevance(irrelevant.id, "irrelevant");
      return [
        {
          type: "evidence_irrelevant",
          evidenceId: evidence.id,
          reason: assessment.reason,
        },
      ];
    }
    const relevant = transitionEvidenceRelevance(evidence, "relevant");
    await this.store.updateEvidenceRelevance(relevant.id, "relevant");

    // 3. retrieve relevant existing claims
    const related: ClaimWithVersions[] = await this.store.getClaimsByUser(
      input.userId,
    );

    // 5–6. LLM interpretation → structured proposals (Zod-validated)
    const raw = await this.interpreter.proposeClaims(relevant, related);
    const proposals: ClaimProposal[] = raw.map((p) =>
      ClaimProposalSchema.parse(p),
    );

    let majorUpdate = false;

    for (const proposal of proposals) {
      // 8. deterministic rules (applied BEFORE persistence)
      const status =
        input.sourceType === "user_correction"
          ? "user_confirmed"
          : proposal.status;

      if (proposal.relatedClaimId) {
        // 7. contradiction engine (PLAN §26): compare, never delete history
        const target = related.find(
          (r) => r.claim.id === proposal.relatedClaimId,
        );
        if (!target) {
          throw new ValidationError(
            `Interpreter referenced unknown claim ${proposal.relatedClaimId}.`,
          );
        }
        const latest = target.versions[target.versions.length - 1];
        if (!latest) {
          throw new ValidationError(
            `Claim ${target.claim.id} has no versions; cannot reinterpret.`,
          );
        }
        const relationship = await this.interpreter.compareClaims(
          proposal.claimText,
          latest.claimText,
        );
        const { claim, version } = applyClaimVersion(target.claim, latest, {
          claimText: proposal.claimText,
          status,
          confidence: proposal.confidence,
          reason: proposal.reason,
        });
        await this.store.saveClaim(claim);
        await this.store.saveClaimVersion(version);
        await this.store.saveClaimEvidence({
          claimId: claim.id,
          evidenceId: evidence.id,
          relationship,
          createdAt: now(),
        });
        target.claim = claim;
        target.versions.push(version);
        if (relationship === "contradicts" || status === "user_confirmed") {
          majorUpdate = true;
        }
        events.push({
          type: "claim_updated",
          claimId: claim.id,
          versionId: version.id,
          relationship,
        });
      } else {
        // 4. genuinely new information → new claim
        const { claim, version } = openClaim({
          userId: input.userId,
          category: proposal.category,
          claimText: proposal.claimText,
          status,
          confidence: proposal.confidence,
          reason: proposal.reason,
        });
        await this.store.saveClaim(claim);
        await this.store.saveClaimVersion(version);
        await this.store.saveClaimEvidence({
          claimId: claim.id,
          evidenceId: evidence.id,
          relationship: "supports",
          createdAt: now(),
        });
        related.push({ claim, versions: [version] });
        events.push({
          type: "claim_created",
          claimId: claim.id,
          versionId: version.id,
        });
      }
    }

    // 10. snapshot when appropriate
    if (majorUpdate) {
      const version =
        (await this.store.getLatestSnapshotVersion(input.userId)) + 1;
      const latestIds: UUID[] = (
        await this.store.getClaimsByUser(input.userId)
      ).map((r) => {
        const v = r.versions[r.versions.length - 1];
        if (!v) {
          throw new ValidationError(`Claim ${r.claim.id} has no versions.`);
        }
        return v.id;
      });
      const snapshot = buildSnapshot({
        userId: input.userId,
        version,
        claimVersionIds: latestIds,
        trigger: "major_update",
      });
      await this.store.saveSnapshot(snapshot);
      events.push({
        type: "snapshot_created",
        snapshotId: snapshot.id,
        version: snapshot.version,
      });
    }

    // evidence fully processed
    await this.store.updateEvidenceRelevance(evidence.id, "processed");
    events.unshift({ type: "evidence_processed", evidenceId: evidence.id });
    return events;
  }
}
