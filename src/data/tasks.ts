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

export async function updateTask(
  id: string,
  changes: Partial<Pick<Task, 'plan_date' | 'title' | 'start_at' | 'duration_min'>>,
): Promise<Task> {
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
