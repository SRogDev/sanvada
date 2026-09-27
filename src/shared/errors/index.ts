// Shared error taxonomy (PLAN §48: AI failures must degrade gracefully).

export class SanvadaError extends Error {
  readonly code: string;

  constructor(code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SanvadaError";
    this.code = code;
  }
}

/** A Zod contract rejected the data at a boundary. */
export class ValidationError extends SanvadaError {
  constructor(message: string, options?: ErrorOptions) {
    super("VALIDATION_ERROR", message, options);
    this.name = "ValidationError";
  }
}

/** An architectural boundary was crossed (e.g. UI touching persistence). */
export class ArchitectureError extends SanvadaError {
  constructor(message: string, options?: ErrorOptions) {
    super("ARCHITECTURE_ERROR", message, options);
    this.name = "ArchitectureError";
  }
}

/**
 * An AI subsystem (LLM, memory, model) is unavailable.
 * Callers must degrade gracefully, never collapse (PLAN §48).
 */
export class ProviderUnavailableError extends SanvadaError {
  readonly provider: string;

  constructor(provider: string, message?: string, options?: ErrorOptions) {
    super(
      "PROVIDER_UNAVAILABLE",
      message ?? `${provider} is unavailable`,
      options,
    );
    this.name = "ProviderUnavailableError";
    this.provider = provider;
  }
}
