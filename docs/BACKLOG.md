# BACKLOG — good ideas that wait until after v1

Add ideas here instead of building them. Each phase only starts once the one before shows real interest.

## After the v1 test, only if testers use it
- **Due dates** (if the Oct 21 review says no for v1): quick manual entry first. Brightspace/LMS sync only with a strong reason, since that's Shovel's ground.
- **Accountability buddy in the app**: a friend sees only the weekly summary.
- **AI, one job at a time, tested on real replies:** turning "study chem" into "10 practice questions from ch. 3" (small, cheap, fast model) · reading messy free-text replies (small model, or keep buttons) · the fix after a miss (mid-size model guided by fixed no-guilt templates) · the weekly summary (mid-size, once a week). Pick providers that don't train on the data, and send as little as possible. Crisis messages never go to a model.
- **A "bandit" method** that learns the best fix for each person, once there's real data (fits Promit's stats background).
- **Better reminders:** buttons on the notification, if cut from v1 · exact alarms on Android if nudges run late.
- **Accounts:** link an email so people can switch phones (Supabase can convert anonymous users) · CAPTCHA before any public sign-up.
- **Offline-first:** save plans on the phone first and sync later (needed for low-data countries).
- **A/B test game features** (streaks with freezes, points) only once there are a few hundred users, and keep only what improves retention.
- **Phone patterns, not conditions:** "Your phone took most of your study blocks this week. Here's what helped others, and when it's worth talking to a doctor."
- **Usability tests** of new screens with Maze (free).

## Phase 2: guide and self-check
- A Newfoundland ADHD assessment guide (who to see, cost, wait times, student accommodations), written from CADDRA, CADDAC and provincial sources (NLCAHR, Bridge the gapp) and reviewed by a clinician.
- An opt-in ASRS 6-question self-check, after asking its copyright holders, framed as "not a diagnosis — talk to a doctor".
- A summary of tracked patterns that the user brings to a doctor.
- Each new condition needs its own sources and an expert reviewer. BPD content needs a clear path to 9-8-8 and local crisis services. Autism content is reviewed by autistic people and clinicians.

## Phase 3: focus blocks (native)
- Opt-in blocking that the student controls: iOS through Apple's Screen Time API (developers report the allow-list doesn't work as documented), Android through AccessibilityService (Google Play requires in-app disclosure, explicit consent and a declaration). Per-task allow lists, and the block starts automatically when a planned session begins.
- A private "content I want to avoid" option that is never named, stored or shared.

## Phase 4: detection, only as research
- An MUN researcher plus clinicians, with ethics approval, comparing app data with real diagnoses (Lab2Market can help commercialize). Then Health Canada first, and the FDA only if selling in the US. Until then the app never names a condition.

## Going global
- Launch in one market, prove the loop, then add countries one language at a time.
- **Bangladesh:** lead with study and stress, not mental illness. A discreet, neutral name and icon. Bangla-first, adapted rather than translated, and reviewed by Bangladeshi psychologists. Small, offline, audio for low literacy. Local help = Kaan Pete Roi. Free there, funded by grants (Grand Challenges Canada).

## Business
- **Who pays:** students in richer countries (subscriptions; check Apple and Google's small-business commission rates), universities and student-success offices (Purdue gives students Shovel free), and employers later. No ads.
- **Programs:** Genesis Evolution (St. John's pre-incubator, for startups with no MVP yet; contact Liam Flanagan), YC Startup School (free), YC co-founder matching.
- **Before a public launch:** a regulatory lawyer confirms the Health Canada/FDA line and Canadian privacy law (PIPEDA), and a counsellor reviews the crisis phrases.
- Play Store: a new personal developer account needs a closed test with 12+ testers for 14 days before going to production.
