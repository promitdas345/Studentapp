// The shapes of our database rows (supabase/migrations/20261022000000_m1_core.sql).
// Dates are local 'YYYY-MM-DD' strings, clock times are 'HH:mm', instants are ISO strings in UTC.

export type HardThing = 'starting' | 'time' | 'forgetting' | 'distraction';

export type TaskStatus = 'planned' | 'started' | 'done' | 'partly' | 'not_yet' | 'unanswered';

export type MissReason = 'too_big' | 'forgot' | 'distracted' | 'tired' | 'out_of_time' | 'other';

export type Tip = 'phone_away' | 'focus_or_move';

// profiles.plan_hint: set by the "Plan fewer" and "Give it more time" fixes (RULES.md §3).
export type PlanHintValue = { cap?: number; double?: boolean; for_date: string } | null;

export type Profile = {
  user_id: string;
  tester_code: string;
  variant: 'full' | 'reminders_only';
  timezone: string;
  weekly_goal: number;
  light_goal: number | null;
  light_goal_week: string | null;
  hard_things: HardThing[];
  plan_time: string;
  quiet_start: string;
  quiet_end: string;
  start_nudges: boolean;
  extra_reminders: boolean;
  plan_hint: PlanHintValue;
  paused_until: string | null;
  consent_version: string;
  consented_at: string;
  age_confirmed: boolean;
  created_at: string;
};

// The profile columns the app may change after sign-up. The migration only grants UPDATE on these,
// so tester_code, variant and the consent fields can't be changed from the app.
export type ProfileChanges = Partial<
  Pick<
    Profile,
    | 'timezone'
    | 'weekly_goal'
    | 'light_goal'
    | 'light_goal_week'
    | 'hard_things'
    | 'plan_time'
    | 'quiet_start'
    | 'quiet_end'
    | 'start_nudges'
    | 'extra_reminders'
    | 'plan_hint'
    | 'paused_until'
  >
>;

export type Task = {
  id: string;
  user_id: string;
  plan_date: string;
  title: string;
  start_at: string;
  duration_min: number;
  status: TaskStatus;
  reason: MissReason | null;
  reason_note: string | null;
  if_then: string | null;
  cue: string | null;
  tip: Tip | null;
  snoozed: boolean;
  from_fix_event: string | null;
  started_at: string | null;
  checked_in_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NewTask = Pick<Task, 'plan_date' | 'title' | 'start_at' | 'duration_min'> &
  Partial<Pick<Task, 'tip' | 'cue' | 'if_then' | 'from_fix_event'>>;
