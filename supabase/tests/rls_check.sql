-- Security self-check for the Milestone 1 tables. Safe to run any time; it leaves nothing behind.
-- How: Supabase dashboard → SQL Editor → New query → paste this whole file → Run.
-- You should see a table where EVERY row says PASS. If a row says FAIL, or you get an error,
-- don't use the app with testers: send the result to the developer.
--
-- What it proves (PLAN.md M1: "a second account can't see the first account's tasks"):
-- it makes two throwaway users, A and B, each with a profile and a task, then acts as A
-- exactly the way the app does (role "authenticated" with A's user id) and tries to read,
-- add, change and delete B's rows, change A's own tester code, and read as a signed-out visitor.
-- At the end it deletes both throwaway users, which also deletes their rows.

drop table if exists pg_temp.rls_results;
create temp table rls_results (step int, check_name text, result text, detail text);

do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  n int;
  outcome text;
  detail text;
  step int := 0;
begin
  -- Two throwaway users and their rows, created as the database owner (bypasses RLS on purpose).
  insert into auth.users (id, instance_id, aud, role, created_at, updated_at)
  values (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now()),
         (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now());
  insert into public.profiles (user_id, tester_code, timezone, consent_version, consented_at, age_confirmed)
  values (a, 'TEAM1', 'America/St_Johns', 'rls-check', now(), true),
         (b, 'TEAM2', 'America/St_Johns', 'rls-check', now(), true);
  insert into public.tasks (user_id, plan_date, title, start_at, duration_min)
  values (a, current_date, 'A task', now(), 25),
         (b, current_date, 'B task', now(), 25);

  -- Each check: act as A (or as a signed-out visitor), try something, then go back to the owner role
  -- before writing the result. A failed statement only undoes its own little block.

  -- 1. A sees exactly one task: its own.
  step := step + 1;
  begin
    perform set_config('request.jwt.claim.sub', a::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    select count(*) into n from public.tasks;
    outcome := case when n = 1 then 'PASS' else 'FAIL' end;
    detail := n || ' task(s) visible';
  exception when others then
    outcome := 'FAIL'; detail := sqlerrm;
  end;
  execute 'reset role';
  insert into rls_results values (step, 'A sees only its own task', outcome, detail);

  -- 2. A can't see B's task.
  step := step + 1;
  begin
    perform set_config('request.jwt.claim.sub', a::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    select count(*) into n from public.tasks where user_id = b;
    outcome := case when n = 0 then 'PASS' else 'FAIL' end;
    detail := n || ' of B''s tasks visible';
  exception when others then
    outcome := 'FAIL'; detail := sqlerrm;
  end;
  execute 'reset role';
  insert into rls_results values (step, 'A can''t read B''s tasks', outcome, detail);

  -- 3. A can't see B's profile, and can see its own.
  step := step + 1;
  begin
    perform set_config('request.jwt.claim.sub', a::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    select count(*) into n from public.profiles;
    outcome := case when n = 1 then 'PASS' else 'FAIL' end;
    detail := n || ' profile(s) visible';
  exception when others then
    outcome := 'FAIL'; detail := sqlerrm;
  end;
  execute 'reset role';
  insert into rls_results values (step, 'A sees only its own profile', outcome, detail);

  -- 4. A can't add a task in B's name.
  step := step + 1;
  begin
    perform set_config('request.jwt.claim.sub', a::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    insert into public.tasks (user_id, plan_date, title, start_at, duration_min)
    values (b, current_date, 'sneaky', now(), 25);
    outcome := 'FAIL'; detail := 'insert was allowed';
  exception when others then
    outcome := 'PASS'; detail := sqlerrm;
  end;
  execute 'reset role';
  insert into rls_results values (step, 'A can''t add a task for B', outcome, detail);

  -- 5. A can't change B's task.
  step := step + 1;
  begin
    perform set_config('request.jwt.claim.sub', a::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    update public.tasks set title = 'changed by A' where user_id = b;
    get diagnostics n = row_count;
    outcome := case when n = 0 then 'PASS' else 'FAIL' end;
    detail := n || ' row(s) changed';
  exception when others then
    outcome := 'PASS'; detail := sqlerrm;
  end;
  execute 'reset role';
  insert into rls_results values (step, 'A can''t change B''s task', outcome, detail);

  -- 6. A can't delete B's task.
  step := step + 1;
  begin
    perform set_config('request.jwt.claim.sub', a::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    delete from public.tasks where user_id = b;
    get diagnostics n = row_count;
    outcome := case when n = 0 then 'PASS' else 'FAIL' end;
    detail := n || ' row(s) deleted';
  exception when others then
    outcome := 'PASS'; detail := sqlerrm;
  end;
  execute 'reset role';
  insert into rls_results values (step, 'A can''t delete B''s task', outcome, detail);

  -- 7. A can't change its own tester code (only settings columns are changeable).
  step := step + 1;
  begin
    perform set_config('request.jwt.claim.sub', a::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    update public.profiles set tester_code = 'FT99' where user_id = a;
    outcome := 'FAIL'; detail := 'tester code change was allowed';
  exception when others then
    outcome := 'PASS'; detail := sqlerrm;
  end;
  execute 'reset role';
  insert into rls_results values (step, 'A can''t change its tester code', outcome, detail);

  -- 8. A can't switch itself to the other test group.
  step := step + 1;
  begin
    perform set_config('request.jwt.claim.sub', a::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    update public.profiles set variant = 'reminders_only' where user_id = a;
    outcome := 'FAIL'; detail := 'variant change was allowed';
  exception when others then
    outcome := 'PASS'; detail := sqlerrm;
  end;
  execute 'reset role';
  insert into rls_results values (step, 'A can''t change its test group', outcome, detail);

  -- 9. A CAN change its own settings (so the checks above aren't passing just because nothing works).
  step := step + 1;
  begin
    perform set_config('request.jwt.claim.sub', a::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    update public.profiles set weekly_goal = 5 where user_id = a;
    get diagnostics n = row_count;
    outcome := case when n = 1 then 'PASS' else 'FAIL' end;
    detail := n || ' row(s) changed';
  exception when others then
    outcome := 'FAIL'; detail := sqlerrm;
  end;
  execute 'reset role';
  insert into rls_results values (step, 'A can change its own settings', outcome, detail);

  -- 10. A CAN add a task for itself.
  step := step + 1;
  begin
    perform set_config('request.jwt.claim.sub', a::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    insert into public.tasks (plan_date, title, start_at, duration_min)
    values (current_date, 'A second task', now(), 10);
    outcome := 'PASS'; detail := 'insert allowed';
  exception when others then
    outcome := 'FAIL'; detail := sqlerrm;
  end;
  execute 'reset role';
  insert into rls_results values (step, 'A can add its own task', outcome, detail);

  -- 11. A signed-out visitor (anon) can't read any tasks.
  step := step + 1;
  begin
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    execute 'set local role anon';
    select count(*) into n from public.tasks;
    outcome := 'FAIL'; detail := n || ' task(s) visible to anon';
  exception when others then
    outcome := 'PASS'; detail := sqlerrm;
  end;
  execute 'reset role';
  insert into rls_results values (step, 'Signed-out visitors can''t read tasks', outcome, detail);

  -- Clean up: deleting the throwaway users also deletes their profiles and tasks (on delete cascade).
  delete from auth.users where id in (a, b);
end;
$$;

select step, check_name, result, detail from rls_results order by step;
