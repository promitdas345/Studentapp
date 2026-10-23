// Tests our SQL without a real Supabase project: runs every migration, then rls_check.sql, in PGlite
// (real Postgres compiled to run inside Node), with a small stand-in for Supabase's auth schema and roles.
// For the developer (or an AI build session) to check a new migration before Promit pastes it into Supabase.
// It is NOT a replacement for running rls_check.sql in the real project once.
//
// PGlite isn't an app dependency, so install it in a scratch folder and run from there:
//   mkdir <scratch>/pg && cd <scratch>/pg && npm init -y && npm install @electric-sql/pglite@0.3
//   node <repo>/supabase/tests/pglite_check.mjs <repo>
// Exits with code 1 if any check says FAIL or anything is left behind.
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = process.argv[2] ?? process.cwd();
// Find PGlite in the folder we're run from, not next to this file.
const requireFromCwd = createRequire(join(process.cwd(), 'index.js'));
const { PGlite } = await import(pathToFileURL(requireFromCwd.resolve('@electric-sql/pglite')).href);

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  grant anon, authenticated, service_role to postgres;
  create schema auth;
  grant usage on schema public to anon, authenticated;
  grant usage on schema auth to anon, authenticated;
  create table auth.users (id uuid primary key, instance_id uuid, aud varchar(255), role varchar(255), email text,
    created_at timestamptz, updated_at timestamptz, is_anonymous boolean not null default false);
  create function auth.uid() returns uuid language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$;
  -- Like an older Supabase project: new public tables get full grants unless a migration revokes them.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
`);

const dir = join(repo, 'supabase', 'migrations');
for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  await db.exec(readFileSync(join(dir, file), 'utf8'));
  console.log('applied', file);
}

const results = await db.exec(readFileSync(join(repo, 'supabase', 'tests', 'rls_check.sql'), 'utf8'));
const rows = results[results.length - 1].rows;
let failed = 0;
for (const r of rows) {
  console.log(`${r.step}. ${r.result}  ${r.check_name} (${r.detail})`);
  if (r.result !== 'PASS') failed++;
}
const left = (await db.query(`select (select count(*) from auth.users)::int as users`)).rows[0];
if (left.users !== 0) {
  console.log('Left behind:', left);
  failed++;
}
console.log(failed === 0 ? `All ${rows.length} checks PASS, nothing left behind.` : `${failed} problem(s).`);
process.exit(failed === 0 ? 0 : 1);
