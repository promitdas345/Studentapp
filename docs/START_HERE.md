# Student App — Starter Kit (read this first)

Made Oct 20, 2026 from our interviews, research and decisions so far. It holds everything a fresh Claude build session needs to start building v1 of the app.

## What's in the kit

| File | What it's for |
|---|---|
| `KICKOFF_PROMPT.md` | The first message to paste into the build session |
| `CLAUDE.md` | Standing rules for the agent: scope, privacy, tone, how to work with you. Stays at the root of the code repo. |
| `docs/PRODUCT.md` | What v1 is: who it's for, the loop, every screen, what's left out |
| `docs/RULES.md` | The heart of the app: check-in reasons → fixes, the exact words the app uses, safety rules |
| `docs/TECH.md` | Stack, data model, notifications, privacy, how testers install it |
| `docs/PLAN.md` | Two-week build plan, cut list, the tester test and how we score it |
| `docs/EVIDENCE.md` | Why we're building this (interviews, research, competitors) |
| `docs/DECISIONS.md` | Decisions so far, and the ones still open |
| `docs/BACKLOG.md` | Good ideas that wait until after v1 |
| `docs/PRIVACY.md` | Draft privacy page (fill in the brackets, then publish it) |
| `docs/AI_LOG.md` | AI-use log for the course (the agent keeps it up to date) |

## How to start (about 30 minutes)

1. On your computer, install **Node.js (LTS version)**, **Git** and **VS Code** if you don't have them. Make free accounts at **github.com**, **expo.dev** and **supabase.com**.
2. Open a new build session. Best: one that can work in a folder on your computer (the Claude desktop app with that folder connected), because running the app on your phone needs your computer and phone on the same Wi-Fi. A cloud session also works: it writes and tests the code and makes cloud builds, and you pull the code to run it.
3. Put this whole folder in the project folder (or attach the zip) and paste the text from `KICKOFF_PROMPT.md` as your first message.
4. When it asks, do the things only you can do: sign in to accounts, create the Supabase project, install test builds on your phone. Put secret keys in a local `.env` file or the tool's login prompt, never in the chat.
5. Every day or two, try the latest build on your phone and tell it what's wrong, one sentence per problem.

No Mac needed: Expo's cloud build service (EAS) builds the iPhone version.

## Costs (checked Oct 20, 2026)

| What | Cost | When |
|---|---|---|
| Expo / EAS | Free plan: 15 Android + 15 iOS cloud builds a month | Now |
| Supabase | Free plan (2 projects; a free project pauses after a week with no activity, and you restore it from the dashboard). Pro is $25/month if we outgrow it. | Now |
| Apple Developer Program | $99 USD a year. Needed for TestFlight and for installing builds on any iPhone. | Before tester builds (~Oct 30), or earlier if your own phone is an iPhone and you want real builds on it |
| Google Play developer account | $25 USD once | Before tester builds, or skip at first: Android testers can install a direct-download build |

About $124 USD covers test builds on both platforms.

## Gates before real testers (anyone outside the team)

- **Dr. Nwauche's OK** that testing the app with students is covered (the course letter only describes interviews). Same question as the check-in test.
- Testers are **18 or older** and see the plain "What we collect" text before they start.
- A **private list** of tester codes and names, kept by the team. Never in the app, the code or the database.
- A **privacy page** online (the agent drafts it).

## Decisions only the team can make

The kit uses these defaults until you change them (full list in `docs/DECISIONS.md`):

1. **Track due dates in v1?** Default: no. Decide at the Oct 21 review (it's Shovel's ground, but P4 and P6 lose deadlines).
2. **App name and icon.** Default working name: "Follow Through". The name can change later; the hidden app ID (`com.promitd.studentapp`) can't change after the first store upload.
3. **Feedback email** shown in the app. Default: hidden until you give one.
4. **Data after the test.** Default: deleted when the test ends, unless a tester keeps using the app.
5. **When to pay** Apple ($99) and Google ($25).
6. **Pass-line details.** Defaults in `docs/PLAN.md` §6. Lock them before testers start on Nov 3, not after.

## The two-week rule

Tester-ready by **Tue Nov 3, 2026**. If it runs late, cut features from the cut list in `docs/PLAN.md` instead of adding time. Once testers are in, judge the app by what they do (check-ins on 4 of 7 days, fixes used), not by what they say about it.
