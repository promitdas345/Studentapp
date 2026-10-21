# DECISIONS

Add new decisions at the bottom of the right table: date, decision, why, who.

## Decided

| Date | Decision | Why | Who |
|---|---|---|---|
| Oct 7 | Build step by step. Each phase starts only once the one before shows real interest. | Y Combinator / Lean approach | Promit |
| Oct 7 | Start as one thing: a daily check-in whose edge is fixing the plan after a miss | Planners remind, blockers block, and neither helps students recover from a bad day | Promit, from Claude's proposal |
| Oct 7 | Pause, don't punish. No streaks, points, leaderboards or characters at first. A weekly goal (4 of 7). | Hanus & Fox 2015, Lally 2010. A/B test game features only once there are a few hundred users. | Promit |
| Oct 7 | Built around what's hard (starting, losing track of time, forgetting, distraction), not neurotypical or neurodivergent modes. No diagnosis data in v1. | Works for undiagnosed students, avoids sensitive data | Promit |
| Oct 7 | The app never names a condition or gives a verdict. Crises go to fixed rules (9-8-8, MUN counselling), never to a model. | Regulation (Health Canada SaMD) and false alarms | Promit |
| Oct 7 | No ads, and no health data to ad networks, ever | Privacy (the FTC fined BetterHelp $7.8M) and focus | Promit |
| Oct 8 | A mobile app, built with **Expo (React Native, TypeScript) + Supabase** | Nudges are the core and native notifications are more reliable. One codebase. Judged business-first. | Promit |
| Oct 14 | Help adapts to the reason for the miss: simple rules first, a learning ("bandit") method later with real data | P6 wants something "more personalized". Shovel and ChatGPT don't adapt. | Promit, from Claude's proposal |
| Oct 14 | No AI in v1. Later: small or mid-size models per job, chosen by testing on real replies, behind a thin layer so providers can be swapped | Cost, speed, privacy, and less dependence on one model | Promit, from Claude's proposal |
| Oct 20 | Lead onboarding and the pitch with the feeling (stop being overwhelmed when work piles up), not planner features | Lesson 12, interviews | Promit |
| Oct 20 | **Start building v1 now**, and change it as interviews continue | Promit's call. The interviews keep going alongside the build. | Promit |

## Kit defaults (Oct 20; the team can change these)

| Default | Why |
|---|---|
| Supabase in **Canada (Central)** | Data stays in Canada |
| **Anonymous accounts + tester codes**, no email | Collects the least. The name list stays private with the team. |
| **Local notifications** only, no push server | Simpler, private, works offline |
| **No third-party analytics or crash SDKs**. Our own `events` table instead. | Less data shared, simpler privacy page |
| **Due dates not in v1** | Shovel's ground and the biggest build. To be decided Oct 21. |
| Working name **Follow Through**, app id `com.promitd.studentapp` | The name is easy to change. The app id can't change after the first store upload. |
| **Max 3 tasks a day**, lengths 10/25/50 (5 and 90 only through fixes) | "Pick 1–3 small things" |
| v1 accountability buddy = **sharing the weekly summary** through the share sheet | Gets the "report to others" effect (Harkin 2016) without building social features |
| Ladder window **14 days**, outcome window **3 days**, "came back" window **2 days** | Short test, easy to change |

## Open: the team decides

| # | Question | Default until decided | When |
|---|---|---|---|
| 1 | Track due dates in v1? (P4 and P6 lose deadlines, but it's Shovel's ground) | No | Oct 21 review |
| 2 | App name and icon (the Bangladesh plan wants a discreet, neutral name) | "Follow Through" | Before the store listings |
| 3 | Feedback email shown in the app and on TestFlight | Hidden in the app. TestFlight needs one, so use the team's. | Before Oct 30 |
| 4 | What happens to testers' data after the test | Deleted at the end unless the tester keeps using the app | Before Nov 3 (it goes on the privacy page) |
| 5 | When to pay Apple ($99/yr) and Google ($25 once), and which platforms to support | Apple by Oct 27 if needed. Google only if several testers have Android and the APK route doesn't work. | Oct 27 |
| 6 | Pass-line details (PLAN.md §6) | As written | **Lock before Nov 3** |
| 7 | Dr. Nwauche's OK that testing the app is covered by the course letter | No testers until it's in writing | Ask now |
| 8 | Is the WhatsApp check-in test running? If so, its reasons and fixes log feeds RULES.md. | — | Oct 21 |
| 9 | Ownership: anyone continuing after the course settles roles and ownership in writing before money, registering a company or applying to a program (e.g. Genesis Evolution) | — | Before any of those |
| 10 | The Verafin work term starts Jan 2027. Read the agreement's terms on outside work and IP before building during the term. | — | Before Jan 2027 |

## Log (agent adds entries here)

| Date | Decision | Why |
|---|---|---|
