// The one Supabase client the whole app uses.
// Set up the way Expo's "Using Supabase" guide shows (checked Oct 21, 2026):
// expo-sqlite's localStorage keeps the sign-in on the phone between launches.
import 'expo-sqlite/localStorage/install';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { checkSupabaseConfig } from './env';

// EXPO_PUBLIC_ values are copied into the app when it's bundled, so anyone can read them.
// That's fine for the URL and the publishable key, because Row Level Security protects the data.
// Read them exactly like this (no destructuring), or Expo can't copy them in.
export const supabaseConfig = checkSupabaseConfig(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

const client: SupabaseClient | null = supabaseConfig.ok
  ? createClient(supabaseConfig.url, supabaseConfig.key, {
      auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// Only refresh the sign-in token while the app is on screen (Expo's Supabase guide).
if (client) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      client.auth.startAutoRefresh();
    } else {
      client.auth.stopAutoRefresh();
    }
  });
}

// Screens check supabaseConfig.ok first and explain what to fix,
// so by the time anything calls this, the client exists.
export function getSupabase(): SupabaseClient {
  if (!client) throw new Error('Supabase is not set up. Check the .env file.');
  return client;
}
