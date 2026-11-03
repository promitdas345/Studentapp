// "Delete my data" (PRODUCT.md S12, TECH.md §10): every row of the user's in events, fix_events,
// tasks and profiles. RLS limits each delete to their own rows; the user_id filter says so too.
// Signing out afterwards is the caller's job. The leftover anonymous sign-in has no data in it,
// and the team removes those in the dashboard at the end of the test.
import { getSupabase } from '../lib/supabase';
import { toDataError } from './errors';

// Children before parents. fix_events would also go with their tasks (on delete cascade),
// but deleting them first means nothing depends on the order of the foreign keys.
const TABLES = ['events', 'fix_events', 'tasks', 'profiles'] as const;

export async function deleteMyData(userId: string): Promise<void> {
  for (const table of TABLES) {
    const { error } = await getSupabase().from(table).delete().eq('user_id', userId);
    if (error) throw toDataError(error);
  }
}
