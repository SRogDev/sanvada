/**
 * Application: mind — central orchestrator (PLAN §27).
 *
 * Responsibilities: understand current intent → determine required agent →
 * retrieve appropriate context → enforce safety → coordinate execution →
 * return final response / UI actions.
 *
 * It must NOT become a giant autonomous reasoning loop. Prefer:
 * event → routing → agent → result.
 *
 * Contracts + routing land in Phase 5. Depends on: domain, ports, Zod,
 * AI abstractions (PLAN §4).
 */
export {};
