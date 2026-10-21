# PRODUCT — v1

The exact words for every screen and notification are in `RULES.md` §7–§8. This file says what each screen does.

## 1. What it is

A one-minute daily check-in that helps university students do the studying they planned. When they miss, it helps fix the plan instead of just reminding them again. Pitch: "Duolingo for following through."

## 2. Who it's for first

MUN undergrads juggling several courses who feel overwhelmed when work piles up after they put something off or fall behind, most of all when several tests and assignments land in the same week. The best first users already tried a fix in the last 6 months (a to-do list, calendar, agenda or planner app) that only partly works. First-years especially, though we haven't confirmed that yet.

Where this comes from (details in `EVIDENCE.md`): in six interviews, five named managing their time as their biggest challenge, four told the same pile-up story, and all six already use a fix that only partly works. One said "it only helps so much", another "It's better than nothing." Our validation deck (Oct 20) scored the "keeping up" problem **yes, so far** and the "can't get started" problem **not really**.

## 3. The feeling we lead with

Students don't want a planner. They want to stop feeling stressed and overwhelmed when work piles up. The welcome screen, store text and weekly view lead with that feeling, not with features. Interviewees said "overwhelmed", "panicked" and "stress". Nobody said "guilty".

## 4. What makes it different

Planners like Shovel schedule and remind. Blockers block. ChatGPT can send a daily reminder. None of them notice when a session didn't happen, ask why, and change the plan. That loop (check in → why → fix, in a no-guilt tone) is our edge.

**It's still a guess.** The interviews showed the problem, not this solution. v1 exists to test whether the fix after a miss gets students back on track.

## 5. Design principles

1. **Under a minute a day.** Planning must take less effort than a paper list. Two interviewees found calendars too much work ("too many steps", "too much barrier to entry").
2. **Pause, don't punish.** No streaks. A weekly goal (default 4 of 7 days). "Welcome back", never "you lost".
3. **The help adapts.** The fix depends on why they missed, and it changes if the same reason keeps happening. Fixes that worked get used again.
4. **Scaffolding.** Lots of structure at first, then control goes back to the student as they do well.
5. **Built around what's hard, not around diagnoses.** Students pick what's hardest for them (starting, losing track of time, forgetting, distraction). No "neurodivergent mode" and no diagnosis data.
6. **Phone-first.** Big buttons, few screens, and every step can be reached from its notification.

## 6. The loop

```
Plan (evening before, or morning): 1–3 small tasks, each with a start time and a length
  → Nudge at the start time ("Starting now?")
  → Check-in after ("Did you get to it?"  Done / Partly / Not yet)
  → If Not yet: why?  Too big / Forgot / Distracted / Tired / Ran out of time / Something else
  → Fix: one suggestion picked by the rules in RULES.md
         (use it, try another, make my own if-then plan, or not now)
  → This week: days checked in vs. goal, what got in the way, "What works for me"
```

## 7. Screens

Three tabs: **Today · This week · Settings**. Everything else opens on top.

### S1 Welcome (first launch only)
Leads with the feeling, says what the app does in one sentence, says it's a student project from a MUN business course, and has one button.
- Done when: a first-time user sees it once and never again.

### S2 What we collect (first launch only)
Plain list of what's collected and what isn't, where it's stored (Canada) and who sees it. Says the app isn't counselling. Has an "I'm 18 or older" checkbox and a **tester code** field. Start stays disabled until both are filled in.
- Nothing is saved anywhere before the user taps Start.
- Tester codes: `FT01`–`FT99` for testers and `TEAM1`–`TEAM4` for us (case-insensitive). Unknown codes get a friendly "Check the code we sent you."
- Done when: tapping Start signs in anonymously and creates the profile, saving the consent version and time, the 18+ confirmation and the phone's time zone.

### S3 Setup (first launch; can be changed later in Settings)
1. "What's hardest for you?" Pick any: Getting started / Losing track of time / Forgetting what I planned / Getting distracted. RULES.md §5 says what each one changes.
2. Weekly goal: 3, 4, 5 or 7 days (default 4).
3. Plan reminder: evening, default 8:30 pm, or morning, default 8:00 am, with an adjustable time.
- Done when: each choice is saved to the profile and changes what RULES.md §5 says it changes.

### S4 Reminders permission
One screen explaining why reminders matter, then the system permission prompt. If the user declines, the app still works and Today shows a "Reminders are off" banner with a button to open settings.

### S5 Today (home)
- Today's tasks: title, start time, length and status (Planned / Done / Partly / Not yet).
- Unanswered tasks from the last 3 days appear at the top under "How did these go?" so a check-in can be answered late. Tasks older than 3 days become `unanswered`. They don't count as misses and don't get fixes.
- An empty state with a "Plan today" button.
- After 5 pm, or once every task is checked in, a "Plan tomorrow" button.
- "This week: 2 of 4 days" shown as dots, not a streak.
- A "Reminders are off" banner when notification permission is missing.
- A "Welcome back" banner (S14) after a gap.

### S6 Plan (add or edit a task)
- Today / Tomorrow switch. The default is Today before 5 pm and Tomorrow after.
- "What will you do?": one line, max 80 characters, with the placeholder "e.g. 10 practice questions from chapter 3". A soft tip appears if the title is 1–2 words. It never blocks saving.
- "When will you start?": a time picker. The default is the user's last-used start time, or the next half hour for today.
- "How long?": 10 / 25 / 50 min, default 25. Fixes can also set 5 or 90 min.
- "Add another" up to **3 tasks per day**. A fix can lower that to 2 for one day.
- The crisis check (RULES.md §6) runs on the title before saving.
- Save shows "You're set. We'll nudge you at 7:00 pm." and reschedules notifications.
- Edit and delete live on the task card on Today.
- Done when: a new user can plan a task in under 30 seconds. Time it with a teammate.

### S7 Start (opened from the nudge, or by tapping a planned task)
"Starting now?" with the task. Three buttons:
- **Start**: status becomes `started` and the timer (S8) opens.
- **In 10 min**: moves the start back 10 minutes, once per task.
- **Not today**: goes straight to the "what got in the way?" part of check-in (S9).
If the start time has already passed, it says "Start now?" instead.

### S8 Focus timer (optional, simple)
A countdown for the planned length with two buttons, "I'm done" and "Stop". Either one opens check-in. The timer works from timestamps, so it survives the app being closed, and a local notification fires when it ends. No blocking, no locking the phone.

### S9 Check-in
"Did you get to it?" with the task, and **Done / Partly / Not yet**.
- **Done**: a short "nice" line. If the last fix was used, the screen says it worked and it's saved to "What works for me".
- **Partly**: "Some is way better than none." Optional "Plan the rest" opens S6 prefilled with "Rest of: [title]".
- **Not yet**: "No problem. What got in the way?" with six reasons. "Something else" shows an optional note field (max 200 characters). The crisis check (RULES.md §6) runs on the note before saving. Then the Fix screen (S10).
- Done when: the answer saves `status`, `reason` and `checked_in_at`, and any earlier fix waiting for an outcome gets its outcome (RULES.md §4).

### S10 Fix
"Let's adjust." Shows **one** fix card picked by `selectFix` (RULES.md §4): a title, one or two sentences and a main button that does something real, like changing the task, reminders or tomorrow's plan. Below it:
- **Try something else**: the next fix in that reason's ladder, then the if-then builder.
- **Make my own plan**: the if-then builder: "If [situation], then I'll [first small step]." with tappable examples. It's saved on the task and shown in its nudge.
- **Not now**: closes the screen and records `dismissed`.
- Done when: every choice is recorded as a `fix_events` row, and the main button for each of the 10 fixes in RULES.md §3 does what the table says.

### S11 This week (tab)
For the current week, Monday to Sunday:
- Days checked in vs. the weekly goal, as dots.
- Tasks done.
- "What got in the way most", once there are 2+ misses.
- "What works for me": fixes whose outcome was `worked`, newest first, no duplicates.
- One gentle suggestion: the first fix for the top reason.
- "Share my week": the phone's share sheet with a short text such as "This week I checked in on 4 of 4 days and finished 7 tasks." It never includes task titles. This is the v1 version of an accountability buddy.

### S12 Settings (tab)
What's hardest for me · Weekly goal · Plan reminder time · Start nudges on/off · Extra reminders on/off · Quiet hours (default 11 pm–8 am) · Take a break (pause reminders for 1, 3 or 7 days) · **Need to talk to someone?** (S13) · What we collect + privacy page link · **Delete my data** (asks twice, then deletes every row and signs out) · Tester code and app version (read-only) · Send feedback (hidden until the team picks an email).

### S13 Need to talk to someone? (Support)
Reachable from Settings at all times, and it opens automatically when the crisis check matches. Calm, short, with tap-to-call and tap-to-text buttons. Content and numbers are in RULES.md §6. Not logged anywhere.

### S14 Welcome back
When the last answered check-in was 3+ days ago, Today shows a banner: "Welcome back. No catching up needed — let's just plan today." Offers a lighter weekly goal for this week. No guilt, no recap of what was missed.

## 8. Notifications (all scheduled on the phone)

| Type | When | Default |
|---|---|---|
| Plan reminder | Daily at the plan-reminder time | On |
| Heads-up | 10 min before a task starts | Off. Turned on by the "forgot" fix or by "Forgetting" at setup |
| Start nudge | At the task's start time | On (can be turned off) |
| Follow-up | 10 min after the start, if they didn't tap Start | Same switch as Heads-up |
| Check-in | Planned end + 5 min, or when the timer ends | On |

Never inside quiet hours or a break, and never more than 8 in a day. Extra reminders are dropped first. Tapping any notification opens the right screen.

## 9. Edge cases to handle

- **Planning a start time that has already passed:** ask "Start now?".
- **Several tasks at the same time:** allowed. Nudges are grouped into one.
- **Not opening the app for days:** the daily plan reminder still fires because it repeats. Old check-ins move to "How did these go?", then `unanswered` after 3 days.
- **Notification permission off:** banner, and the app still works.
- **Clock change (Sun Nov 1, 2026) and NL's half-hour offset:** times stay right (TECH.md §7).
- **Phone's time zone changes (travel):** the profile time zone updates on app open, and tasks keep their real start times.
- **Reinstalling:** a new anonymous account. The tester enters the same code, and our analysis groups data by code.
- **No internet:** saving shows "Couldn't save. Check your connection and try again." and keeps what they typed. Notifications already scheduled still fire.

## 10. Not in v1

Due dates, syllabus or Brightspace import (decision at the Oct 21 review, default no) · app or site blocking · streaks, points, badges, leaderboards, characters · AI/LLM features · study tools (flashcards, quizzes) · meditation · mental-health articles · self-tests or screeners · diagnosis anything · in-app buddies or friends · email accounts · Bangla or other languages (but all copy is in one file, ready to translate) · payments · ads. Reasons are in `DECISIONS.md` and later plans in `BACKLOG.md`.
