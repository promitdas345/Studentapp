// Reading and writing the signed-in user's profile row. RLS makes sure it's only ever their own.
import { getSupabase } from '../lib/supabase';
import { toDataError } from './errors';
import type { Profile, ProfileChanges } from './types';

// Saved with each profile. Change it whenever the "What we collect" text (S2) changes,
// so we know which version each tester agreed to.
export const CONSENT_VERSION = 'collect-2026-10-21';

// Postgres `time` columns come back as 'HH:mm:ss'. The app works in 'HH:mm'.
function fromRow(row: Profile): Profile {
  return {
    ...row,
    plan_time: row.plan_time.slice(0, 5),
    quiet_start: row.quiet_start.slice(0, 5),
    quiet_end: row.quiet_end.slice(0, 5),
  };
}

export async function fetchMyProfile(): Promise<Profile | null> {
  const { data, error } = await getSupabase().from('profiles').select('*').maybeSingle();
  if (error) throw toDataError(error);
  return data ? fromRow(data as Profile) : null;
}

export type NewProfile = Pick<
  Profile,
  'tester_code' | 'timezone' | 'consent_version' | 'consented_at' | 'age_confirmed'
>;

export async function createProfile(input: NewProfile): Promise<Profile> {
  // user_id isn't sent: the column defaults to auth.uid(), the signed-in user.
  const { data, error } = await getSupabase().from('profiles').insert(input).select('*').single();
  if (error) throw toDataError(error);
  return fromRow(data as Profile);
}

export async function updateMyProfile(userId: string, changes: ProfileChanges): Promise<Profile> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .update(changes)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw toDataError(error);
  return fromRow(data as Profile);
}
