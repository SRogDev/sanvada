/**
 * Sanvada API v1 — TypeScript client.
 *
 * Framework-agnostic: works in Node 18+, browsers, edge runtimes.
 * This is how a product builder integrates the understanding pipeline:
 *
 *   const sanvada = new SanvadaClient({ baseUrl, apiKey });
 *   await sanvada.ingest("user-123", [{ sourceType: "conversation", content: "..." }]);
 *   const model = await sanvada.understand("user-123");
 *   const { selections } = await sanvada.select("user-123", candidates);
 */

export type EvidenceSourceType =
  | "conversation"
  | "experience_report"
  | "assessment"
  | "user_confirmation"
  | "user_correction"
  | "system_observation";

export interface IngestEvent {
  sourceType: EvidenceSourceType;
  content: string;
  structuredData?: Record<string, unknown> | null;
}

export interface ClaimView {
  id: string;
  userId: string;
  category: string;
  text: string;
  confidence: number;
  status: string;
  evidenceCount: number;
  updatedAt: string;
}

export interface SelectionCandidate {
  experienceId: string;
  fit: number;
  novelty: number;
  risk: "low" | "medium" | "high";
}

export interface SelectionResult {
  experienceId: string;
  score: number;
  rationale: string;
  modelVersion: string;
  inputHash: string;
}

export class SanvadaApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "SanvadaApiError";
    this.status = status;
  }
}

export interface SanvadaClientOptions {
  baseUrl: string;
  apiKey: string;
  fetchFn?: typeof fetch;
}

export class SanvadaClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchFn: typeof fetch;

  constructor({ baseUrl, apiKey, fetchFn }: SanvadaClientOptions) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
    this.fetchFn = fetchFn ?? fetch;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await this.fetchFn(`${this.baseUrl}/api/v1${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
    } & T;
    if (!res.ok) {
      throw new SanvadaApiError(
        res.status,
        data.error ?? `Request failed with status ${res.status}`,
      );
    }
    return data as T;
  }

  /** INGEST: append user events as immutable evidence. */
  ingest(
    userId: string,
    events: IngestEvent[],
  ): Promise<{ userId: string; count: number; evidenceIds: string[] }> {
    return this.post("/ingest", { userId, events });
  }

  /** MODEL: distill the user's evidence into confidence-scored claims. */
  understand(
    userId: string,
  ): Promise<{ userId: string; modelVersion: string; claims: ClaimView[] }> {
    return this.post("/understand", { userId });
  }

  /** SELECT: rank candidates for the user, best-first. */
  select(
    userId: string,
    candidates: SelectionCandidate[],
    objectiveId?: string,
  ): Promise<{
    userId: string;
    understandModelVersion: string;
    selectionModelVersion: string;
    contextSnapshotId: string;
    selections: SelectionResult[];
  }> {
    return this.post("/select", { userId, candidates, objectiveId });
  }
}
