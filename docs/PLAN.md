# PLAN — build v1 in two weeks, then test it with real students

**Goal:** tester-ready by **Tue Nov 3, 2026**. If it runs late, cut from §3 instead of adding time.

## §1 Timeline

| Dates (2026) | Milestone | Notes |
|---|---|---|
| Tue Oct 20 – Wed Oct 21 | **M0 Setup** | **If Promit's phone is an iPhone, Expo Go needs the Apple Developer Program ($99) now** (DECISIONS open question 5); otherwise test M0–M1 on an Android phone. Doesn't depend on the Oct 21 review. If the review changes the segment or the problem, update PRODUCT.md before M2. |
| Thu Oct 22 – Sat Oct 24 | **M1 Data, onboarding, Today, Plan** | |
| Sun Oct 25 – Tue Oct 27 | **M2 Notifications, Start, timer, first development build** | Apple's $99: see DECISIONS open question 5 (needed from M0 on an iPhone) |
| Wed Oct 28 – Fri Oct 30 | **M3 Check-in, fixes, safety** | The team starts using the app daily (team codes) once check-in works. **Fri Oct 30: submit the first TestFlight build for Beta App Review** and make the Android APK. |
| Sat Oct 31 – Mon Nov 2 | **M4 This week, Settings, delete, polish, privacy page** | **Sun Nov 1: clocks go back.** Check that every nudge that day is on time. |
| Tue Nov 3 | **M5 Go / no-go**, then the first in-person onboardings | §7 checklist |
| Tue Nov 3 – Mon Nov 16 | **Tester test** (14 days) | Day 5 = Sat Nov 7. Last 7 days = Nov 10–16. |
| Tue Nov 17 | **Score the test** and write the Learning Card | §6 |
| Week 9 (early Nov, check Brightspace) | Course pivot-or-persevere | Use the interviews, the WhatsApp check-ins (if they ran) and the first app days |
| Week 12 (late Nov, check Brightspace) | Course MVP testing | Use the improved build |

## §2 Milestones: what "done" means, checked on a real phone

**M0 Setup**
- The repo exists, with `CLAUDE.md` at the root and the docs in `docs/`. Private GitHub repo `student-app`.
- The app opens on Promit's phone in Expo Go and shows a test screen that reads one row from Supabase.
- The Supabase project is in Canada (Central), anonymous sign-ins are on, and `.env` works.

**M1 Data, onboarding, Today, Plan**
- The migration is applied, RLS is on for all 4 tables, and a second account can't see the first account's tasks.
- Onboarding S1–S4 takes under 2 minutes. The profile row has the code, time zone, consent version and 18+ confirmation.
- A teammate who has never seen the app can plan a task in **under 30 seconds** (time it). A 4th task is refused politely. Edit and delete work.

**M2 Notifications, Start, timer**
- With the phone locked, a task planned 3 minutes ahead gets its nudge on time on iPhone. On Android, measure the lateness and write it in DECISIONS.md.
- Tapping the nudge opens S7. "In 10 min" moves it once. The timer survives closing the app. The check-in notification arrives at the end.
- The daily plan reminder fires at the set time. Quiet hours and breaks are respected.
- The unit tests for `buildSchedule` and `time.ts` pass (TECH.md §11).
- A development build is installed on Promit's phone.

**M3 Check-in, fixes, safety**
- Walk through all 6 reasons. Each shows the right fix card, and each of the 10 main buttons does what RULES.md §3 says.
- A second miss with the same reason within 14 days shows step 2, and a third shows "Make your own plan".
- "Done" after a used fix says it worked. The `fix_events` row shows `worked`.
- Typing a crisis phrase from RULES.md §6.1 into a title opens Support, and the text isn't saved. Every call and text button works.
- The unit tests for `selectFix`, outcomes and safety pass.

**M4 This week, Settings, polish**
- This week's numbers match the database after 3 days of team use.
- The share text has no task titles.
- Take a break pauses reminders. Welcome back appears after 3+ days (test by editing `checked_in_at` in the dashboard).
- Delete my data leaves no rows for that user (check the dashboard) and returns to Welcome.
- The privacy page is live, and `docs/PRIVACY.md` matches the app.

**M5 Tester builds**
- The TestFlight external build is approved and the Android APK link works.
- The private tester list (code → name, phone type, onboarding time) is ready, and no data is in it.

## §3 Cut list

Cut in this order if behind:
1. Buttons on the notifications ("Start" / "In 10 min"). Tapping the notification is enough.
2. The scaffolding card (RULES.md §5.2).
3. The bad-weeks card (RULES.md §5.3).
4. The reminders-only comparison (§5).
5. The best-time-of-day line in `tired_1`.
6. Share my week.
7. The focus timer: the check-in comes at the planned end instead.
8. The routine picker in `forgot_2`: use the if-then builder instead.

**Never cut:** "What we collect" and the 18+ check · Plan · the start nudge · check-in with reasons · the fix screen with all 10 fixes plus "Make my own plan" · recording outcomes · the crisis check and Support screen · RLS · Delete my data · This week's days-vs-goal.

## §4 The team while Promit builds (a suggestion; the team confirms)

- **Promit:** builds. Tries every build on his phone the same day.
- **Sam (recruiting):** tester tracker (code, iPhone or Android, onboarding slot). Asks interviewees who said "contact me" (P6 first) and their referrals. Aim for **12 testers so that 10 stay**, including first-years, and avoid close friends and BUSI 3630 classmates.
- **Austin:** reviews the privacy page and the TestFlight description. Keeps "who pays" (students or the university) and the competitor watch (Shovel, ChatGPT) current for BMC v2.
- **Alex:** reads every screen's text (RULES.md §8) aloud with one non-team student and notes what confuses them. Writes the onboarding script and the day-5 and day-14 messages. Leads the week 12 presentation.
- **All four:** use the app daily from M3 with codes TEAM1–4 (team data never counts). Each person looks after 2–3 testers during the test.
- Ask about phones while recruiting. If every tester has an iPhone, skip Android (and its $25). If most have Android, the free APK route is enough.

## §5 The tester test (Tue Nov 3 – Mon Nov 16)

**Gates (all must be true):** Dr. Nwauche has said the app test is covered · the tester is 18+ · they've seen "What we collect" · they were recruited as an early adopter (tried a fix in the last 6 months) · they're on the private list.

**Onboarding, in person, 10–15 minutes (the "Collison installation": set it up with them):**
1. "This is a student project app. We're testing it for two weeks. It isn't counselling."
2. Go through "What we collect" together. Confirm they're 18+.
3. Install it (the TestFlight link or the APK) and enter their code.
4. Plan their first task together, and make it concrete ("10 practice questions from ch. 3").
5. "You'll get a nudge when it's time, and a check-in after. Tap 'Not yet' honestly. That's the point, and missing is fine."
6. "To stop, delete your data in Settings or text us 'stop'. Here's who to contact."

**During the test:**
- Judge it by what they do, not what they say. Don't coach them on the fix screen after onboarding.
- If a tester has been quiet 2+ days, the teammate sends one friendly text (at most one every 3 days): "Hey! No pressure — is anything getting in the way? Even 'I forgot it exists' helps us."
- Ask about moments, not opinions: "Tell me about the last nudge you got. What happened next?"
- **Day 5 (Sat Nov 7):** "Would you miss the check-ins if they stopped?"
- **Day 14 (Mon Nov 16):** the Sean Ellis question ("How would you feel if you could no longer use Follow Through? Very disappointed / Somewhat disappointed / Not disappointed"), then "What's one moment it helped, or got in the way?", then "Who else do you know who'd want this?" Follow with a 10-minute talk with 3–4 testers about their last miss and what the fix did.

**Optional comparison:** only with **16+ testers**. Randomly set half to `variant = 'reminders_only'` (no fix screen after "Not yet", just "Thanks — noted.") and compare. With fewer testers, skip it. There are too few people for the split to tell us anything.

## §6 Metrics and the pass line

**Lock these before Nov 3. Don't change them after seeing the data.** These are the defaults, and the team can edit them until then.

Definitions, in each tester's local time, excluding TEAM codes:
- **Active day:** a day with at least one answered check-in (`done`, `partly` or `not_yet`).
- **Miss:** a check-in answered `not_yet`.
- **Fix used:** a `fix_events` row with choice `used` or `own_plan` for that miss.
- **Fix worked:** a used fix with outcome `worked`.
- **Came back after a miss:** an answered check-in within 2 days after the miss.

**Pass line (from the Phase 0 plan, with the details filled in):** the solution test passes if **at least 6 in 10 testers** both
(a) had **4+ active days in their last 7 days** (Nov 10–16), and
(b) **used a fix after at least half of their misses** (testers with no misses are judged on (a) only).

**Signals, not pass/fail:** Sean Ellis "very disappointed" at 40%+ (with about 10 testers it's only a hint, since the benchmark assumes 40+ answers) · fix worked rate · came-back rate · nudge open rate · share of tasks left `unanswered`.

**If it fails, look at where it broke.** If they stopped checking in, the loop is too much work or not worth it. If they checked in but skipped the fixes, the fixes aren't useful. Per the Phase 0 plan, change the segment or the problem before building more features.

Example query (the agent writes the rest the same way):

```sql
-- Active days per tester in the last 7 days of the test
with checkins as (
  select p.tester_code,
         (t.checked_in_at at time zone p.timezone)::date as day
  from tasks t
  join profiles p using (user_id)
  where t.status in ('done','partly','not_yet')
    and p.tester_code not like 'TEAM%'
)
select tester_code, count(distinct day) as active_days
from checkins
where day between date '2026-11-10' and date '2026-11-16'
group by tester_code
order by tester_code;
```

## §7 Go / no-go checklist (Tue Nov 3)

- [ ] Dr. Nwauche's OK received in writing
- [ ] The full loop works on both platforms (plan → on-time nudge → check-in → fix → outcome recorded)
- [ ] The privacy and security checklist in TECH.md §10 is all ticked
- [ ] Crisis check and Support screen tested. The numbers were re-checked this week.
- [ ] The team has used it for 3+ days, with no crash in the last 2 days
- [ ] The pass line in §6 is locked and written in DECISIONS.md
- [ ] Testers are booked for onboarding, and the private list is ready

## §8 After the test

- Write a Learning Card: "We believed that… / We observed… / From that we learned that… / Therefore, we will…".
- Update BMC/VPC v2 and decide what the week 12 MVP keeps. Only keep the steps testers actually used.
- Testers who want to keep using it can. For those who leave, follow the data decision in DECISIONS.md.
- The results feed sections 2–3 of the final report. Cite AI use from `AI_LOG.md`.
