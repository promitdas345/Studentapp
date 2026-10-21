# Docs check (Oct 21, 2026)

What the current official Expo and Supabase docs say that changes or adds to the kit's plan. Checked against the docs' source on GitHub (expo/expo and supabase/supabase, as of Oct 20, 2026), because the websites were blocked in the build session. Re-check anything here before relying on it after November 2026.

Paths are inside each repo's docs folder: Expo `docs/pages/…`, Supabase `apps/docs/content/guides/…`.

## Already applied in Milestone 0

- **SDK 57, not 58, for Expo Go.** During the SDK 58 transition, Expo Go runs SDK 57 (Expo `get-started/create-a-project.mdx`).
- **iPhone Expo Go needs the Apple Developer Program.** The App Store's Expo Go stops at SDK 54. Newer SDKs need `npx eas-cli@latest go` through TestFlight (Expo `troubleshooting/expo-go-version-mismatch.mdx`, `scenes/get-started/set-up-your-environment/instructions/iosPhysicalExpoGo.mdx`).
- **On iPhone, Expo CLI and Expo Go must be signed in to the same Expo account**, or the project won't open (same page).
- **Screens go in `src/app/`.** "Only the src/app directory will be used if you have both" (Expo `router/reference/src-directory.mdx`). Never put tests or other non-route files inside `src/app/`.
- **Session storage is `expo-sqlite/localStorage/install`** with `detectSessionInUrl: false`, plus the AppState start/stop auto-refresh listener (Expo `guides/using-supabase.mdx`; Supabase `getting-started/quickstarts/expo-react-native.mdx`). No URL polyfill is needed in Expo.
- **Key variable: `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.** Publishable keys start `sb_publishable_`, secret keys `sb_secret_` (Supabase `getting-started/api-keys.mdx`).
- **`ios.config.usesNonExemptEncryption: false`** in app.json (Expo `submit/testflight.mdx`).
- **Grants are explicit:** `revoke all` then grant only what's needed, in the same migration as RLS (Supabase `api/securing-your-api.mdx`, `database/postgres/row-level-security.mdx`).

## For Milestone 1 (database, onboarding)

- **One policy per action, not `for all`:** separate `select`, `insert`, `update` and `delete` policies, each `to authenticated`. Keep the delete policies, because "Delete my data" needs them.
- **Use `(select auth.uid()) = user_id`** in policies, not a bare `auth.uid()`, so it runs once per query (Supabase `database/postgres/row-level-security.mdx`, "Call functions with select").
- **Grants on every table:** `revoke all on table … from anon, authenticated;` then `grant select, insert, update, delete on table … to authenticated;`.
- **Index every `user_id` column** that policies filter on (`tasks`, `fix_events`, `events`). `profiles.user_id` is the primary key, so it's already indexed.
- **Enums vs text:** the docs advise enums only for small, fixed sets. Values can't be removed from an enum. The kit expects rules to change during the test, so prefer `text` with a `check` constraint (the kit already does this for `choice`, `outcome` and `tip`).
- **Anonymous sign-ins** are rate-limited to **30 per hour per IP** (changeable under Authentication → Rate Limits). In-person onboarding of several testers on one campus network could hit this, so raise the limit before Nov 3 (Supabase `auth/auth-anonymous.mdx`).
- **Converting anonymous users later** needs "Allow manual linking" turned on (beta) and `linkIdentity`, or `updateUser({ email })` (same page).
- **RLS tests:** the docs suggest pgTAP files in `supabase/tests/`, run with `supabase test db`. That needs the Supabase CLI and Docker. The kit's manual two-account check is the simpler route for v1.
- **Drop the `hello` table** in the first M1 migration.

## For Milestone 2 (notifications, development build)

- **Android: create the `reminders` channel before asking for notification permission.** The Android 13+ prompt doesn't appear until a channel exists (Expo `versions/v57.0.0/sdk/notifications.mdx`).
- **Exact timing on Android 12+** needs `SCHEDULE_EXACT_ALARM` in `android.permissions`, and Android 14+ denies it by default. SDK 58 adds `getExactAlarmPermissionsAsync`/`requestExactAlarmPermissionsAsync`. Don't use `USE_EXACT_ALARM`, because Play limits it to alarm-clock and calendar apps.
- **Tap handling:** the root layout must never return `null`, or notification navigation is lost. SDK 58's pattern is `getLastNotificationResponse()` + `addNotificationResponseReceivedListener` + `clearLastNotificationResponse()`, and it prefers `useRouter()` over the module-level `router`. Check the exact API in the SDK version in use.
- **Time zone on iOS:** `expo-localization` values stay the same while the app runs on iOS, and can be `null`. Re-read on Android when the app comes to the foreground, and always have a fallback.
- **Intl with `timeZone` on Hermes** isn't covered by the docs, so the real-device check of America/St_Johns and the Nov 1 clock change (TECH.md §7) is still required.
- **Trigger types** (`SchedulableTriggerInputTypes.DATE` / `DAILY`) are only in the generated API reference, which wasn't in the cloned source. Check docs.expo.dev for the SDK in use before M2.
- **Node 22 or newer:** EAS CLI has deprecated Node 20 (Expo `eas/cli.mdx`).
