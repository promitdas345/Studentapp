// Small query functions for the tasks table. RLS limits every query to the user's own rows.
import { getSupabase } from '../lib/supabase';
import { toDataError } from './errors';
import type { NewTask, Task } from './types';

export async function fetchTasksOnDates(dates: string[]): Promise<Task[]> {
  const { data, error } = await getSupabase()
    .from('tasks')
    .select('*')
    .in('plan_date', dates)
    .order('start_at', { ascending: true });
  if (error) throw toDataError(error);
  return (data ?? []) as Task[];
}

export async function fetchTask(id: string): Promise<Task | null> {
  const { data, error } = await getSupabase().from('tasks').select('*').eq('id', id).maybeSingle();
  if (error) throw toDataError(error);
  return (data as Task | null) ?? null;
}

// Check-ins answered since an instant, for "This week: n of goal days".
export async function fetchCheckInsSince(sinceIso: string): Promise<Pick<Task, 'status' | 'checked_in_at'>[]> {
  const { data, error } = await getSupabase()
    .from('tasks')
    .select('status, checked_in_at')
    .gte('checked_in_at', sinceIso);
  if (error) throw toDataError(error);
  return (data ?? []) as Pick<Task, 'status' | 'checked_in_at'>[];
}

export async function insertTasks(rows: NewTask[]): Promise<Task[]> {
  const { data, error } = await getSupabase().from('tasks').insert(rows).select('*');
  if (error) throw toDataError(error);
  return (data ?? []) as Task[];
}

// The columns the app changes after a task is planned: editing (S6), Start and "In 10 min" (S7)
// and the check-in (S9). user_id and the timestamps are never sent.
export type TaskChanges = Partial<
  Pick<
    Task,
    | 'plan_date'
    | 'title'
    | 'start_at'
    | 'duration_min'
    | 'status'
    | 'reason'
    | 'reason_note'
    | 'started_at'
    | 'checked_in_at'
    | 'snoozed'
  >
>;

export async function updateTask(id: string, changes: TaskChanges): Promise<Task> {
  const { data, error } = await getSupabase()
    .from('tasks')
    .update(changes)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw toDataError(error);
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await getSupabase().from('tasks').delete().eq('id', id);
  if (error) throw toDataError(error);
}

// Misses ("Not yet") answered since an instant, for selectFix's 14-day count.
export async function fetchMissesSince(sinceIso: string): Promise<Pick<Task, 'reason' | 'checked_in_at'>[]> {
  const { data, error } = await getSupabase()
    .from('tasks')
    .select('reason, checked_in_at')
    .eq('status', 'not_yet')
    .gte('checked_in_at', sinceIso);
  if (error) throw toDataError(error);
  return (data ?? []) as Pick<Task, 'reason' | 'checked_in_at'>[];
}

// Answered check-ins planned since an instant, for the best time of day (RULES.md §4.4).
export async function fetchAnsweredSince(sinceIso: string): Promise<Pick<Task, 'status' | 'start_at'>[]> {
  const { data, error } = await getSupabase()
    .from('tasks')
    .select('status, start_at')
    .in('status', ['done', 'partly', 'not_yet'])
    .gte('start_at', sinceIso);
  if (error) throw toDataError(error);
  return (data ?? []) as Pick<Task, 'status' | 'start_at'>[];
}

// Tasks planned before a local date that were never answered become `unanswered`: they don't
// count as misses and don't get fixes (PRODUCT.md S5).
export async function markUnansweredBefore(date: string): Promise<void> {
  const { error } = await getSupabase()
    .from('tasks')
    .update({ status: 'unanswered' })
    .lt('plan_date', date)
    .in('status', ['planned', 'started']);
  if (error) throw toDataError(error);
}
