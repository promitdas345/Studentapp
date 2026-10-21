// Every word the app shows lives here (CLAUDE.md rule 7), so it can be translated later.
// Screen text comes from docs/RULES.md §7–§8. Change it there first, then here.

export const en = {
  // Milestone 0 only: a temporary screen that proves the app can reach Supabase.
  // It goes away when onboarding (S1–S4) is built in Milestone 1.
  setupCheck: {
    title: 'Follow Through',
    subtitle: 'Setup check',
    loading: 'Checking the connection…',
    connected: 'Connected to Supabase. The test row says:',
    missingEnv:
      'The Supabase settings are missing. Copy .env.example to .env, fill in the two values, then restart Expo.',
    badUrl:
      'The Supabase URL in .env doesn’t look right. It needs to start with https://, like https://abcd.supabase.co.',
    secretKey:
      'This is a secret key. It must never go in the app, and it was already copied into it. In Supabase, go to Project Settings → API Keys and delete this key (for the old service_role key, turn off the legacy keys there). Then put the publishable key in .env and restart Expo.',
    noRow:
      'Connected, but the test data isn’t there yet. In Supabase, open SQL Editor, paste the file from supabase/migrations and run it. Then tap Try again.',
    readFailed: 'Couldn’t read from Supabase:',
    retry: 'Try again',
  },

  errors: {
    saveFailed: 'Couldn’t save. Check your connection and try again.',
    server: 'Something went wrong on our side. Try again in a minute.',
  },
} as const;
