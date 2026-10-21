// Checks the two Supabase values from .env before the app uses them.
// Pure (no reads of process.env here), so it can be unit tested: pass the values in.

export type SupabaseConfig =
  | { ok: true; url: string; key: string }
  | { ok: false; problem: 'missing' | 'bad_url' | 'secret_key' };

export function checkSupabaseConfig(
  url: string | undefined,
  key: string | undefined,
): SupabaseConfig {
  const cleanUrl = url?.trim();
  const cleanKey = key?.trim();
  if (!cleanUrl || !cleanKey) return { ok: false, problem: 'missing' };
  if (!cleanUrl.startsWith('https://')) return { ok: false, problem: 'bad_url' };
  if (isSecretKey(cleanKey)) return { ok: false, problem: 'secret_key' };
  return { ok: true, url: cleanUrl, key: cleanKey };
}

// A secret key skips Row Level Security, so it must never be in the app (CLAUDE.md rule 5).
// New secret keys start with "sb_secret_". The legacy one is a JWT whose role is "service_role".
export function isSecretKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true;
  return jwtRole(key) === 'service_role';
}

function jwtRole(token: string): string | undefined {
  const parts = token.split('.');
  if (parts.length !== 3) return undefined;
  try {
    const payload: unknown = JSON.parse(decodeBase64Url(parts[1]));
    if (typeof payload === 'object' && payload !== null && 'role' in payload) {
      const role = (payload as { role: unknown }).role;
      return typeof role === 'string' ? role : undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function decodeBase64Url(part: string): string {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
}
