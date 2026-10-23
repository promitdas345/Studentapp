# Follow Through (working name)

A phone app that helps university students do the studying they planned, and fix the plan when a day goes sideways. BUSI 3630 team project (Memorial University).

- **Rules for anyone (or any AI agent) working on the code:** [`CLAUDE.md`](CLAUDE.md)
- **What v1 is and why:** [`docs/`](docs/), starting with [`docs/PRODUCT.md`](docs/PRODUCT.md) and [`docs/PLAN.md`](docs/PLAN.md)

## Run it on your phone

You need [Node.js](https://nodejs.org/) (the current LTS version, at least 22.13) and Git on your computer, and the **Expo Go** app (SDK 57) on your phone. Your computer and phone must be on the same Wi-Fi.

- **Android:** install Expo Go from Google Play. If it says the project needs a different version, get the SDK 57 build from [expo.dev/go](https://expo.dev/go).
- **iPhone:** the App Store's Expo Go only runs SDK 54. For this project, Expo Go has to come through TestFlight (`npx eas-cli@latest go`), which needs the Apple Developer Program ($99 USD a year). See `docs/DECISIONS.md` open question 5.

1. **Get the code and install the packages** (first time only). The repo is private, so sign in to GitHub when git asks.
   ```bash
   git clone https://github.com/promitdas345/Studentapp.git
   cd Studentapp
   npm install
   ```
   npm may say it found "vulnerabilities". That's expected. **Don't run `npm audit fix --force`**: it swaps in the wrong Expo version. If package versions ever look wrong, run `npx expo install --fix` instead.
2. **Set up Supabase** (first time only):
   1. At [supabase.com](https://supabase.com), create a new project. Pick the region **Canada (Central)**, and save the database password in a password manager.
   2. Go to **Authentication**, open the sign-in providers page (**Sign In / Providers**), and turn on **Allow anonymous sign-ins**.
   3. Go to **SQL Editor** → **New query**. Paste the whole of each file in `supabase/migrations/`, oldest first, and click **Run** for each one. Each file runs only once.
   4. Run `supabase/tests/rls_check.sql` the same way. Every row should say **PASS**.
3. **Make your settings file:** copy `.env.example` to a new file called `.env`, then replace the two example values with your project's URL and **publishable** key (Supabase dashboard → your project → **Connect**). `.env` is git-ignored, so it never goes to GitHub.
4. **iPhone only, first time:** sign in to the same Expo account in both places. On your computer, run `npx expo login`. In Expo Go, tap the account icon at the top right. Expo Go on iPhone only opens your project when both use the same account.
5. **Start the app:**
   ```bash
   npx expo start
   ```
6. **Scan the QR code** it shows: with the **Camera** app on iPhone, or from inside **Expo Go** on Android.

You should see the **Welcome** screen ("When work piles up, it's easy to feel buried."). Tap through: What we collect (tick 18+, enter your tester code, e.g. TEAM1) → Setup → Reminders → **Today**. If `.env` is missing or wrong, the app says what to fix instead.

**Expected in Expo Go on Android:** two yellow warnings from `expo-notifications` about Expo Go. They're about *push* notifications, which we don't use (our reminders are created on the phone). They go away with the development build in Milestone 2.

If the phone can't connect (common on campus or other public Wi-Fi), stop it with Ctrl+C and run `npx expo start --tunnel` instead. It's slower, but it works across networks. After changing `.env`, restart with `npx expo start --clear` so the new values are picked up.

To get later changes: `git pull`, then `npm ci`, then `npx expo start` again. `npm ci` installs exactly what `package-lock.json` lists and never changes that file. (`npm install` can rewrite it, and then the next `git pull` stops with "Your local changes … would be overwritten". If that happens, run `git restore package-lock.json` and pull again.)

## Checks to run before calling something done

```bash
npm test            # unit tests
npm run typecheck   # TypeScript errors
npm run lint        # code style and React mistakes
npx expo-doctor     # Expo's project health check
```

## Database

SQL files live in `supabase/migrations/`, oldest first. To apply one: Supabase dashboard → **SQL Editor** → **New query** → paste the whole file → **Run**.

After applying a migration, run `supabase/tests/rls_check.sql` the same way. It tries to read and change another user's data and prints a table: **every row should say PASS**. It cleans up after itself.
