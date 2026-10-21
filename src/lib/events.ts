// Our own minimal analytics (TECH.md §8), stored in the events table under the user's own row.
// The names and props are fixed types, so free text and task titles can never end up here.
// Never track Support screen opens or crisis-check matches.
import { getSupabase } from './supabase';

type NudgeKind = 'plan' | 'heads_up' | 'start' | 'follow_up' | 'checkin' | 'timer';
type SettingKey =
  | 'hard_things'
  | 'weekly_goal'
  | 'plan_time'
  | 'start_nudges'
  | 'extra_reminders'
  | 'quiet_hours'
  | 'paused_until';

type EventProps = {
  app_open: undefined;
  onboarding_done: undefined;
  notification_permission: { granted: boolean };
  nudge_opened: { kind: NudgeKind };
  start_tapped: undefined;
  snooze_tapped: undefined;
  timer_started: undefined;
  week_viewed: undefined;
  summary_shared: undefined;
  welcome_back_shown: undefined;
  settings_changed: { key: SettingKey };
};

export type EventName = keyof EventProps;

// Fire and forget: a lost event must never get in the student's way.
export function track<N extends EventName>(
  name: N,
  ...props: EventProps[N] extends undefined ? [] : [EventProps[N]]
): void {
  getSupabase()
    .from('events')
    .insert({ name, props: props[0] ?? {} })
    .then(
      () => undefined,
      () => undefined,
    );
}
