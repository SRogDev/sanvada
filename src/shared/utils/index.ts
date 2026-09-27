// Pure, dependency-free helpers only. Anything touching I/O, the
// database, or an LLM belongs in application/ or infrastructure/.

/** Exhaustiveness guard for discriminated unions. */
export function assertNever(value: never, message = "unreachable"): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}
