// Warnings for the developer, shown in the Expo terminal while testing and never in a real build.
// For steps that fail quietly on purpose (the student sees a calm message or nothing at all),
// so a problem on a test phone still leaves a trace. Only the error's message is printed:
// never pass task titles, notes or anything else the student typed (TECH.md §10).
export function devWarn(where: string, error: unknown): void {
  if (!__DEV__) return;
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[${where}] ${message}`);
}
