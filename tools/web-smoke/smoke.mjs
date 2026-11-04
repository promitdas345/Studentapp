// Browser smoke test for Follow Through (the react-native-web build), with Supabase faked in memory.
// Walks: onboarding → Today → Plan → Start → timer → check-in (Not yet) → Fix → Plan (prefilled)
// → Done on the fix's task → This week → Settings → What we collect → crisis check.
// Run it with tools/web-smoke/run.sh, which starts the web dev server first. Exits 1 if a step
// fails or the browser logs an error. Screenshots go to <outDir>.
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const require = createRequire(execSync('npm root -g').toString().trim() + '/');
const { chromium } = require('playwright');

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const APP = 'http://localhost:8099';
const SUPA = 'https://mock.supabase.co';
const USER_ID = '11111111-1111-4111-8111-111111111111';
const now = () => new Date().toISOString();

// ─── The fake Supabase ───────────────────────────────────────────────────────────────────────
const db = { profiles: [], tasks: [], fix_events: [], events: [] };
const defaults = {
  profiles: () => ({ user_id: USER_ID, variant: 'full', weekly_goal: 4, light_goal: null, light_goal_week: null,
    hard_things: [], plan_time: '20:30:00', quiet_start: '23:00:00', quiet_end: '08:00:00', start_nudges: true,
    extra_reminders: false, plan_hint: null, paused_until: null, created_at: now() }),
  tasks: () => ({ id: randomUUID(), user_id: USER_ID, status: 'planned', reason: null, reason_note: null, if_then: null,
    cue: null, tip: null, snoozed: false, from_fix_event: null, started_at: null, checked_in_at: null,
    created_at: now(), updated_at: now() }),
  fix_events: () => ({ id: randomUUID(), user_id: USER_ID, choice: null, outcome: null, outcome_task_id: null, created_at: now() }),
  events: () => ({ id: randomUUID(), user_id: USER_ID, props: {}, created_at: now() }),
};

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function session() {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const user = { id: USER_ID, aud: 'authenticated', role: 'authenticated', is_anonymous: true, app_metadata: {}, user_metadata: {}, created_at: now() };
  return { access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USER_ID, role: 'authenticated', aud: 'authenticated', exp })}.sig`,
    token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'refresh-1', user };
}

const isTime = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v);
const cmp = (a, b) => (isTime(a) && isTime(b) ? Date.parse(a) - Date.parse(b) : String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0);

function matches(row, key, raw) {
  let neg = false;
  let expr = raw;
  if (expr.startsWith('not.')) { neg = true; expr = expr.slice(4); }
  const dot = expr.indexOf('.');
  const op = expr.slice(0, dot);
  const val = expr.slice(dot + 1);
  const v = row[key];
  let ok;
  if (op === 'eq') ok = String(v) === val;
  else if (op === 'neq') ok = String(v) !== val;
  else if (op === 'in') ok = val.replace(/^\(|\)$/g, '').split(',').map((s) => s.replace(/^"|"$/g, '')).includes(String(v));
  else if (op === 'gte') ok = v !== null && cmp(v, val) >= 0;
  else if (op === 'gt') ok = v !== null && cmp(v, val) > 0;
  else if (op === 'lte') ok = v !== null && cmp(v, val) <= 0;
  else if (op === 'lt') ok = v !== null && cmp(v, val) < 0;
  else if (op === 'is') ok = val === 'null' ? v === null : String(v) === val;
  else throw new Error(`fake db: unknown filter ${op}`);
  return neg ? !ok : ok;
}

const SPECIAL = new Set(['select', 'order', 'limit', 'offset', 'columns', 'on_conflict']);
function restHandler(method, table, params, headers, body) {
  const rows = db[table];
  if (!rows) return { status: 404, json: { message: `no table ${table}` } };
  const filtered = () => rows.filter((row) => [...params.entries()].every(([k, v]) => SPECIAL.has(k) || matches(row, k, v)));
  const select = params.get('select') ?? '*';
  const project = (row) => (select === '*' ? row : Object.fromEntries(select.split(',').map((c) => [c, row[c]])));
  const wantsObject = (headers['accept'] ?? '').includes('vnd.pgrst.object');
  const representation = (headers['prefer'] ?? '').includes('return=representation');
  const reply = (list, status = 200) => {
    if (method !== 'GET' && !representation) return { status: method === 'POST' ? 201 : 204 };
    const out = list.map(project);
    if (wantsObject) {
      if (out.length !== 1) return { status: 406, json: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `The result contains ${out.length} rows`, hint: null } };
      return { status, json: out[0] };
    }
    return { status, json: out };
  };
  if (method === 'GET') {
    let list = filtered();
    const order = params.get('order');
    if (order) {
      const [col, dir] = order.split('.');
      list = [...list].sort((a, b) => (dir === 'desc' ? -1 : 1) * cmp(a[col] ?? '', b[col] ?? ''));
    }
    const limit = params.get('limit');
    if (limit) list = list.slice(0, Number(limit));
    return reply(list);
  }
  if (method === 'POST') {
    const input = Array.isArray(body) ? body : [body];
    const added = input.map((r) => ({ ...defaults[table](), ...r }));
    rows.push(...added);
    return reply(added, 201);
  }
  if (method === 'PATCH') {
    const list = filtered();
    for (const row of list) Object.assign(row, body, table === 'tasks' ? { updated_at: now() } : {});
    return reply(list);
  }
  if (method === 'DELETE') {
    const list = filtered();
    db[table] = rows.filter((r) => !list.includes(r));
    return reply(list);
  }
  return { status: 405, json: { message: method } };
}

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
async function handleSupabase(route) {
  const req = route.request();
  const url = new URL(req.url());
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
  let result;
  if (url.pathname.startsWith('/auth/v1/')) {
    const path = url.pathname.slice('/auth/v1/'.length);
    if (path === 'signup' || path === 'token') result = { status: 200, json: session() };
    else if (path === 'user') result = { status: 200, json: session().user };
    else if (path === 'logout') result = { status: 204 };
    else result = { status: 404, json: { message: path } };
  } else if (url.pathname.startsWith('/rest/v1/')) {
    const table = url.pathname.slice('/rest/v1/'.length);
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    result = restHandler(req.method(), table, url.searchParams, await req.allHeaders(), body);
  } else result = { status: 404, json: {} };
  return route.fulfill({
    status: result.status,
    headers: { ...CORS, 'content-type': 'application/json' },
    body: result.json === undefined ? '' : JSON.stringify(result.json),
  });
}

// ─── The walk ────────────────────────────────────────────────────────────────────────────────
const problems = [];
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'America/St_Johns', locale: 'en-CA' });
const page = await context.newPage();
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
let currentStep = 'start';
page.on('console', (m) => { if (m.type() === 'error') problems.push(`[${currentStep}] console.error: ${m.text().slice(0, 1500)}`); });
await page.route(`${SUPA}/**`, handleSupabase);

let n = 0;
const shot = async (name) => page.screenshot({ path: `${OUT}/${String(++n).padStart(2, '0')}-${name}.png` });
const see = (text, timeout = 15000) => page.getByText(text, { exact: false }).filter({ visible: true }).first().waitFor({ timeout });
const tap = (name) => page.getByRole('button', { name, exact: true }).filter({ visible: true }).first().click();
const step = async (name, fn) => {
  currentStep = name;
  try {
    await fn();
    console.log(`PASS  ${name}`);
  } catch (e) {
    console.log(`FAIL  ${name}: ${e.message.split('\n')[0]}`);
    await shot(`FAIL-${name.replace(/\W+/g, '-')}`);
    throw e;
  }
};

try {
  await step('Welcome loads', async () => {
    await page.goto(APP);
    await see('When work piles up', 180000);
    await shot('welcome');
  });
  await step('What we collect → sign up with TEAM1', async () => {
    await tap('Let’s start');
    await see('What we collect');
    await page.getByRole('checkbox').click();
    await page.getByLabel('Tester code').fill('team1');
    await tap('Start');
    await see('What’s hardest for you?');
    await shot('setup');
  });
  await step('Setup → Reminders → Today', async () => {
    await tap('Getting started');
    await tap('Next');
    await see('Can we nudge you?');
    await tap('Not now');
    await see('Nothing planned yet');
    await shot('today-empty');
  });
  await step('Plan a task', async () => {
    const planToday = page.getByRole('button', { name: 'Plan today', exact: true });
    await ((await planToday.count()) > 0 ? planToday.first() : page.getByRole('button', { name: 'Plan tomorrow', exact: true }).first()).click();
    await page.getByLabel('What will you do?').fill('Read chapter 3');
    await tap('Save');
    await see('You’re set. We’ll nudge you at');
    await see('Read chapter 3');
    await shot('today-planned');
  });
  await step('Start → timer', async () => {
    await page.getByText('Read chapter 3', { exact: true }).first().click();
    await see('Starting now?');
    await see('Just the first few minutes.'); // "Getting started" line
    await shot('start');
    await tap('Start');
    await page.getByText(/^\d\d:\d\d left$/).first().waitFor({ timeout: 15000 });
    await shot('timer');
  });
  await step('Stop → check-in → Not yet → It felt too big', async () => {
    await tap('Stop');
    await see('Did you get to it?');
    await tap('Not yet');
    await see('No problem. What got in the way?');
    await tap('It felt too big');
    await see('Let’s adjust.');
    await see('Shrink it');
    await shot('fix');
  });
  await step('Shrink it → Plan prefilled for tomorrow → save', async () => {
    await tap('Plan the first 10 minutes');
    await see('We’ll plan it for tomorrow at');
    const title = await page.getByLabel('What will you do?').inputValue();
    if (title !== 'First 10 min: Read chapter 3') throw new Error(`prefilled title was "${title}"`);
    await shot('plan-from-fix');
    await tap('Save');
    await see('Tomorrow');
    await see('First 10 min: Read chapter 3');
    await shot('today-after-fix');
  });
  await step('Done on the fix’s task says the fix worked', async () => {
    await page.getByText('First 10 min: Read chapter 3', { exact: true }).first().click();
    await see('Starting now?');
    await tap('Start');
    await tap('Stop');
    await see('Did you get to it?');
    await tap('Done');
    await see('That fix worked. Saved to What works for me.');
    await shot('fix-worked');
    await tap('Back');
  });
  await step('This week', async () => {
    await page.getByText('This week', { exact: true }).last().click();
    await see('What works for me');
    await see('Tasks done: 1');
    await see('Shrink it');
    await shot('week');
  });
  await step('Settings: take a break and end it', async () => {
    await page.getByText('Settings', { exact: true }).last().click();
    await see('Take a break');
    await tap('1 day');
    await see('Taking a break is fine. Reminders are off until');
    await shot('settings-break');
    await tap('Turn reminders back on');
    await page.getByRole('button', { name: '3 days', exact: true }).first().waitFor({ timeout: 15000 });
  });
  await step('What we collect from Settings', async () => {
    await tap('What we collect');
    await see('Your plans: what you want to do and when');
    await tap('Back');
    await see('Take a break');
  });
  await step('Crisis words in a title open Support and save nothing', async () => {
    await page.getByText('Today', { exact: true }).last().click();
    await see('This week:');
    const before = db.tasks.length;
    const plan = page.getByRole('button', { name: /^Plan (today|tomorrow)$/ }).first();
    await plan.click();
    await page.getByLabel('What will you do?').fill('end it all');
    await tap('Save');
    await see('Need to talk to someone?');
    await see('It sounds like things might be really hard right now.');
    await shot('support');
    if (db.tasks.length !== before) throw new Error('a task was saved');
    await tap('Back');
    const title = await page.getByLabel('What will you do?').inputValue();
    if (title !== '') throw new Error(`title not emptied: "${title}"`);
  });
} catch {
  // The failing step already printed and took a screenshot.
  process.exitCode = 1;
} finally {
  console.log('--- fake database ---');
  console.log('tasks:', db.tasks.map((t) => `${t.title} [${t.status}${t.reason ? `/${t.reason}` : ''}${t.from_fix_event ? ', from fix' : ''}]`).join(' | '));
  console.log('fix_events:', db.fix_events.map((f) => `${f.fix_id} choice=${f.choice} outcome=${f.outcome}`).join(' | '));
  console.log('events:', [...new Set(db.events.map((e) => e.name))].join(', '));
  console.log('profile:', JSON.stringify(db.profiles.map(({ tester_code, timezone, hard_things, paused_until }) => ({ tester_code, timezone, hard_things, paused_until }))));
  console.log(`--- ${problems.length} browser error(s) ---`);
  if (problems.length > 0) process.exitCode = 1;
  for (const p of [...new Set(problems)].slice(0, 25)) console.log(p);
  await browser.close();
}
