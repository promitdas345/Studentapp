# Follow Through (working name)

A phone app that helps university students do the studying they planned, and fix the plan when a day goes sideways. BUSI 3630 team project (Memorial University).

- **Rules for anyone (or any AI agent) working on the code:** [`CLAUDE.md`](CLAUDE.md)
- **What v1 is and why:** [`docs/`](docs/), starting with [`docs/PRODUCT.md`](docs/PRODUCT.md) and [`docs/PLAN.md`](docs/PLAN.md)

## Run it on your phone

You need [Node.js](https://nodejs.org/) (the LTS version, 22 or newer) and Git on your computer, and the **Expo Go** app (SDK 57) on your phone. Your computer and phone must be on the same Wi-Fi.

- **Android:** install Expo Go from Google Play. If it says the project needs a different version, get the SDK 57 build from [expo.dev/go](https://expo.dev/go).
- **iPhone:** the App Store's Expo Go only runs SDK 54. For this project, Expo Go has to come through TestFlight (`npx eas-cli@latest go`), which needs the Apple Developer Program ($99 USD a year). See `docs/DECISIONS.md` open question 5.

1. Get the code and install the packages (first time only):
   ```bash
   git clone https://github.com/promitdas345/student-app.git
   cd student-app
   npm install
   ```
2. Make your settings file: copy `.env.example` to a new file called `.env`, then fill in your Supabase project's URL and **publishable** key (Supabase dashboard → your project → **Connect**). `.env` is git-ignored, so it never goes to GitHub.
3. **iPhone only, first time:** sign in to the same Expo account in both places. On your computer, run `npx expo login`. In Expo Go, tap the account icon at the top right. Expo Go on iPhone only opens your project when both use the same account.
4. Start the app:
   ```bash
   npx expo start
   ```
5. Scan the QR code it shows: with the **Camera** app on iPhone, or from inside **Expo Go** on Android.

If the phone can't connect (common on campus or other public Wi-Fi), stop it with Ctrl+C and run `npx expo start --tunnel` instead. It's slower, but it works across networks.

To get later changes: `git pull`, then `npm install`, then `npx expo start` again.

## Checks to run before calling something done

```bash
npm test            # unit tests
npm run typecheck   # TypeScript errors
npm run lint        # code style and React mistakes
npx expo-doctor     # Expo's project health check
```

## Database

SQL files live in `supabase/migrations/`, oldest first. To apply one: Supabase dashboard → **SQL Editor** → **New query** → paste the whole file → **Run**.
