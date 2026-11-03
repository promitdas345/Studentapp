// Small query functions for the fix_events table: one row per fix card shown (TECH.md §4).
// RLS limits every query to the user's own rows.
import { getSupabase } from '../lib/supabase';
import { toDataError } from './errors';
import type { FixChoice, FixEvent, FixOutcome, MissReason } from './types';

// The student's whole fix history: selectFix needs every turned-down and worked card, and during
// the test that's a few rows a day.
export async function fetchFixEvents(): Promise<FixEvent[]> {
  const { data, error } = await getSupabase()
    .from('fix_events')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw toDataError(error);
  return (data ?? []) as FixEvent[];
}

export async function fetchFixEvent(id: string): Promise<FixEvent | null> {
  const { data, error } = await getSupabase().from('fix_events').select('*').eq('id', id).maybeSingle();
  if (error) throw toDataError(error);
  return (data as FixEvent | null) ?? null;
}

// A card is shown: its row exists before the student picks anything (choice stays empty
// until they do).
export async function insertFixEvent(row: { task_id: string; reason: MissReason; fix_id: string }): Promise<FixEvent> {
  const { data, error } = await getSupabase().from('fix_events').insert(row).select('*').single();
  if (error) throw toDataError(error);
  return data as FixEvent;
}

export async function setFixChoice(id: string, choice: FixChoice): Promise<void> {
  const { error } = await getSupabase().from('fix_events').update({ choice }).eq('id', id);
  if (error) throw toDataError(error);
}

export async function setFixOutcome(id: string, outcome: FixOutcome, outcomeTaskId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('fix_events')
    .update({ outcome, outcome_task_id: outcomeTaskId })
    .eq('id', id);
  if (error) throw toDataError(error);
}

// Fixes that worked, for "What works for me" (PRODUCT.md S11).
export async function fetchWorkedFixEvents(): Promise<Pick<FixEvent, 'fix_id' | 'outcome' | 'created_at'>[]> {
  const { data, error } = await getSupabase()
    .from('fix_events')
    .select('fix_id, outcome, created_at')
    .eq('outcome', 'worked');
  if (error) throw toDataError(error);
  return (data ?? []) as Pick<FixEvent, 'fix_id' | 'outcome' | 'created_at'>[];
}
