import { checkSupabaseConfig, isSecretKey } from './env';

// Builds a fake (unsigned) JWT with the given role, shaped like Supabase's legacy keys.
function fakeJwt(role: string): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ iss: 'supabase', role })}.signature`;
}

const URL_OK = 'https://abcdefghijklmnopqrst.supabase.co';

describe('checkSupabaseConfig', () => {
  test('accepts a URL and a publishable key, trimming spaces', () => {
    expect(checkSupabaseConfig(` ${URL_OK} `, ' sb_publishable_abc123 ')).toEqual({
      ok: true,
      url: URL_OK,
      key: 'sb_publishable_abc123',
    });
  });

  test('accepts a legacy anon key', () => {
    expect(checkSupabaseConfig(URL_OK, fakeJwt('anon')).ok).toBe(true);
  });

  test('reports missing values', () => {
    expect(checkSupabaseConfig(undefined, 'sb_publishable_abc')).toEqual({ ok: false, problem: 'missing' });
    expect(checkSupabaseConfig(URL_OK, undefined)).toEqual({ ok: false, problem: 'missing' });
    expect(checkSupabaseConfig('  ', '  ')).toEqual({ ok: false, problem: 'missing' });
  });

  test('treats the .env.example placeholders as missing', () => {
    expect(
      checkSupabaseConfig('https://your-project-ref.supabase.co', 'sb_publishable_your_key_here'),
    ).toEqual({ ok: false, problem: 'missing' });
    expect(checkSupabaseConfig(URL_OK, 'sb_publishable_your_key_here')).toEqual({ ok: false, problem: 'missing' });
  });

  test('reports a URL that is not https', () => {
    expect(checkSupabaseConfig('abcdefghijklmnopqrst.supabase.co', 'sb_publishable_abc')).toEqual({
      ok: false,
      problem: 'bad_url',
    });
  });

  test('refuses a new-style secret key', () => {
    expect(checkSupabaseConfig(URL_OK, 'sb_secret_abc123')).toEqual({ ok: false, problem: 'secret_key' });
  });

  test('refuses a legacy service_role key', () => {
    expect(checkSupabaseConfig(URL_OK, fakeJwt('service_role'))).toEqual({ ok: false, problem: 'secret_key' });
  });
});

describe('isSecretKey', () => {
  test('is false for keys it cannot read', () => {
    expect(isSecretKey('not-a-key')).toBe(false);
    expect(isSecretKey('a.%%%.c')).toBe(false);
  });
});
