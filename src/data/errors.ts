// Turns a failed Supabase call into one of the two messages the app shows (RULES.md §8 "Errors").
// A PostgREST/Postgres error has a code, so the server answered and something went wrong there.
// Anything else (no code) means the request never got an answer: usually no internet.

export type DataErrorKind = 'network' | 'server';

export class DataError extends Error {
  readonly kind: DataErrorKind;
  // The Postgres/PostgREST error code when the server answered, e.g. '23505' (duplicate row).
  readonly code: string | null;

  constructor(kind: DataErrorKind, detail: string, code: string | null = null) {
    super(detail);
    this.name = 'DataError';
    this.kind = kind;
    this.code = code;
  }
}

export function toDataError(error: unknown): DataError {
  if (error instanceof DataError) return error;
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code: unknown }).code
      : undefined;
  const message = error instanceof Error ? error.message : String(
    typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: unknown }).message
      : error,
  );
  return typeof code === 'string' && code.length > 0
    ? new DataError('server', message, code)
    : new DataError('network', message);
}
