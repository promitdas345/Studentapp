#!/bin/bash
# Browser smoke test: runs the app on the web (react-native-web) with Supabase faked in memory and
# walks the main loop in headless Chromium, failing on any step or browser error. For a build session
# to catch crashes and broken navigation before Promit tests on a phone. It is NOT the phone test:
# notifications, the time picker and Android behaviour can only be checked on a real phone
# (docs/APP_GUIDE.md §3).
#
# Needs Playwright with Chromium (installed in Claude Code cloud sessions) and bash, so it's for
# the cloud session, not Promit's Windows laptop.
#   tools/web-smoke/run.sh            screenshots in tools/web-smoke/shots/ (git-ignored)
# It writes a throwaway .env, metro.config.js and app.config.js, and always deletes them again.
set -u
REPO=$(cd "$(dirname "$0")/../.." && pwd)
OUT=${1:-$REPO/tools/web-smoke/shots}
PORT=8099
cd "$REPO" || exit 1
for f in .env metro.config.js app.config.js; do
  if [ -e "$f" ]; then echo "$f already exists; not touching it."; exit 1; fi
done
cleanup() {
  lsof -ti:$PORT -sTCP:LISTEN | xargs -r kill
  rm -f .env metro.config.js app.config.js
}
trap cleanup EXIT
rm -rf "$OUT" && mkdir -p "$OUT"
cp tools/web-smoke/metro.config.web-smoke.js metro.config.js
cp tools/web-smoke/app.config.web-smoke.js app.config.js
printf 'EXPO_PUBLIC_SUPABASE_URL=https://mock.supabase.co\nEXPO_PUBLIC_SUPABASE_KEY=sb_publishable_mock\n' > .env
EXPO_OFFLINE=1 CI=1 BROWSER=none npx expo start --web --port $PORT --clear > "$OUT/server.log" 2>&1 &
if ! timeout 180 bash -c "until curl -sf http://localhost:$PORT >/dev/null; do sleep 2; done"; then
  echo "The web dev server didn't start:"; tail -20 "$OUT/server.log"; exit 1
fi
node tools/web-smoke/smoke.mjs "$OUT"
