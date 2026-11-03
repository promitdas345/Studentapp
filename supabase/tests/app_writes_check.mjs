// Checks that every write the app makes is allowed by the migrations, signed in as an ordinary
// user (role "authenticated"), in PGlite with the same stand-in for Supabase as pglite_check.mjs.
// rls_check.sql proves users can't touch each other's rows; this proves the app's own writes work:
// planning, Start and "In 10 min", check-ins, fix cards and their outcomes, the unanswered sweep,
// settings, and Delete my data. Run it after changing a migration or a query in src/data/.
//
// Same setup as pglite_check.mjs (PGlite in a scratch folder):
//   node <repo>/supabase/tests/app_writes_check.mjs <repo>
// Exits with code 1 on the first write that fails.
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = process.argv[2] ?? process.cwd();
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
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
`);
for (const file of readdirSync(join(repo, 'supabase', 'migrations')).filter((f) => f.endsWith('.sql')).sort()) {
  await db.exec(readFileSync(join(repo, 'supabase', 'migrations', file), 'utf8'));
}

const me = '11111111-1111-1111-1111-111111111111';
await db.exec(`insert into auth.users (id) values ('${me}');`);

// Runs SQL exactly as the app's requests do: role authenticated, signed in as `me`.
async function asMe(sql) {
  const results = await db.exec(`
    begin;
    select set_config('request.jwt.claims', '{"sub":"${me}","role":"authenticated"}', true);
    set local role authenticated;
    ${sql};
    commit;`);
  return results[results.length - 2]?.rows ?? [];
}

let step = 0;
async function check(name, sql, expect) {
  step += 1;
  try {
    const rows = await asMe(sql);
    if (expect && !expect(rows)) throw new Error(`unexpected result: ${JSON.stringify(rows)}`);
    console.log(`${step}. PASS  ${name}`);
  } catch (error) {
    await db.exec('rollback;').catch(() => undefined);
    console.log(`${step}. FAIL  ${name}: ${error.message}`);
    process.exit(1);
  }
}

// The same columns src/data/ sends.
await check('S2: create the profile', `insert into public.profiles (tester_code, timezone, consent_version, consented_at, age_confirmed)
  values ('TEAM1', 'America/St_Johns', 'collect-2026-10-21', now(), true)`);
await check('S3/Settings: change every setting the app can change', `update public.profiles set
  timezone = 'America/St_Johns', weekly_goal = 5, light_goal = 4, light_goal_week = '2026-11-02', hard_things = '{starting,time}',
  plan_time = '20:30', quiet_start = '23:00', quiet_end = '08:00', start_nudges = false, extra_reminders = true,
  plan_hint = '{"cap":2,"for_date":"2026-11-04"}'::jsonb, paused_until = '2026-11-06'
  where user_id = '${me}' returning user_id`, (rows) => rows.length === 1);
await check('S6: plan two tasks, one with what a fix sets', `insert into public.tasks (plan_date, title, start_at, duration_min, tip, cue, if_then, from_fix_event)
  values ('2026-11-03', 'Read ch. 3', '2026-11-03T22:30:00Z', 25, 'phone_away', null, null, null),
         ('2026-11-04', 'First 10 min: Essay', '2026-11-04T22:30:00Z', 10, 'focus_or_move', 'supper',
          'If I get home from class, then I’ll open my notes right away.', gen_random_uuid())`);
await check('S6: edit a task', `update public.tasks set title = 'Read ch. 4', start_at = '2026-11-03T23:00:00Z', duration_min = 50
  where title = 'Read ch. 3' returning id`, (rows) => rows.length === 1);
await check('S7: "In 10 min"', `update public.tasks set start_at = '2026-11-03T23:10:00Z', snoozed = true
  where title = 'Read ch. 4' returning id`, (rows) => rows.length === 1);
await check('S7: Start', `update public.tasks set status = 'started', started_at = now()
  where title = 'Read ch. 4' returning id`, (rows) => rows.length === 1);
await check('S9: answer Not yet with a reason and a note', `update public.tasks
  set status = 'not_yet', reason = 'other', reason_note = 'Group project ran late', checked_in_at = now()
  where title = 'Read ch. 4' returning id`, (rows) => rows.length === 1);
await check('S10: show a fix card', `insert into public.fix_events (task_id, reason, fix_id)
  select id, 'other', 'if_then' from public.tasks where title = 'Read ch. 4' returning id`, (rows) => rows.length === 1);
await check('S10: save the choice', `update public.fix_events set choice = 'used' where fix_id = 'if_then' returning id`,
  (rows) => rows.length === 1);
await check('S9: settle the fix’s outcome', `update public.fix_events set outcome = 'worked',
  outcome_task_id = (select id from public.tasks where title = 'First 10 min: Essay') where fix_id = 'if_then' returning id`,
  (rows) => rows.length === 1);
await check('S5: old unanswered tasks become unanswered', `update public.tasks set status = 'unanswered'
  where plan_date < '2026-11-05' and status in ('planned', 'started') returning id`, (rows) => rows.length === 1);
await check('Events: track an event', `insert into public.events (name, props) values ('week_viewed', '{}'::jsonb)`);
await check('Reads the app makes', `select (select count(*) from public.tasks)::int as tasks,
  (select count(*) from public.fix_events)::int as fixes, (select count(*) from public.events)::int as events`,
  (rows) => rows[0].tasks === 2 && rows[0].fixes === 1 && rows[0].events === 1);
await check('Delete my data: every row, in the app’s order', `delete from public.events;
  delete from public.fix_events; delete from public.tasks; delete from public.profiles`);
await check('…and nothing is left', `select (select count(*) from public.tasks) + (select count(*) from public.fix_events)
  + (select count(*) from public.events) + (select count(*) from public.profiles) as left_over`,
  (rows) => Number(rows[0].left_over) === 0);

console.log(`All ${step} app writes PASS.`);
