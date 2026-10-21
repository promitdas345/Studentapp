# RULES — tone, fixes, safety and every word the app shows

This is the heart of the app. Logic goes in `src/rules/` (data plus pure functions with unit tests). Words go in `src/copy/en.ts`. If a rule here feels wrong once real testers use it, change it here first, log why in `DECISIONS.md`, then change the code.

## §1 Tone

- Short sentences and everyday words, at about a grade 6 reading level. One idea per screen.
- **Talk about the plan, not the person.** "The plan was too big", not "You couldn't do it."
- **Never use:** failed, failure, "you missed", lost, behind, should, lazy, procrastinate (don't label the student), streak, or punishment words. No emoji in v1, and at most one exclamation mark per screen.
- **Use:** Not yet · Let's adjust · Some is better than none · Welcome back · You're set.
- **No condition or medical words** (ADHD, anxiety, depression, disorder, symptoms, diagnosis) anywhere except the Support screen (§6).
- Never compare the student with other people ("most students…"). Celebrate small, specific progress, not hours.
- Why: interviewees described overwhelm and panic, and self-forgiveness predicts less procrastination next time (Wohl, Pychyl & Bennett 2010). See `EVIDENCE.md`.

## §2 Check-in answers and reasons

Answers: `done` · `partly` · `not_yet`. Only **`not_yet` is a miss**. That includes "Not today" from the Start screen. `partly` is never a miss.

| id | Button label | Meaning |
|---|---|---|
| `too_big` | It felt too big | Couldn't start, or didn't know where to start |
| `forgot` | I forgot | Didn't remember at the time |
| `distracted` | I got distracted | Phone, laptop or people pulled them away |
| `tired` | I was too tired | Low energy |
| `out_of_time` | I ran out of time | Other things took the time, or the task was longer than planned |
| `other` | Something else | Optional note (max 200 characters), checked by §6 before saving |

## §3 Fix ladders

Each reason has two fixes, in order (step 1, then step 2). `other` goes straight to the if-then builder. "Reschedule" means: open the Plan screen prefilled for **tomorrow at the same start time**, which the student can change before saving. The new task stores `from_fix_event`.

| Fix id | Title | What the main button does |
|---|---|---|
| `too_big_1` | Shrink it | Reschedule with title "First 10 min: {title}" and length 10 |
| `too_big_2` | Make it tiny | Reschedule with title "Just open it: {title}" and length 5 |
| `forgot_1` | Get a heads-up | Turn on `extra_reminders` in the profile (heads-up 10 min before plus a follow-up 10 min after), then reschedule |
| `forgot_2` | Tie it to a routine | Routine picker: after supper / after my last class / when I get home / after lunch / custom. Then ask "About what time is that?" Saves `cue` on the rescheduled task. |
| `distracted_1` | Phone out of reach | Reschedule and set `tip = 'phone_away'`, so the nudge adds that tip |
| `distracted_2` | Block it, or move | Reschedule and set `tip = 'focus_or_move'` |
| `tired_1` | Try a better time | Reschedule with the time picker open. Once there are 5+ answered check-ins, show their best time of day (§4.4). |
| `tired_2` | Go shorter | Reschedule with length 10 |
| `out_of_time_1` | Plan fewer | Set `plan_hint = {cap: 2, for_date: tomorrow}`, then open tomorrow's Plan with the missed task prefilled |
| `out_of_time_2` | Give it more time | Reschedule with double the length (10→25, 25→50, 50→90; 90 stays 90) and set `plan_hint = {double: true, for_date: tomorrow}` |
| `if_then` | Make your own plan | If-then builder (§8). Saves `if_then` on the rescheduled task. |

Lengths allowed in the database: 5, 10, 25, 50, 90. The Plan screen only offers 10, 25 and 50. Fixes can set 5 and 90.

This table adapts the Oct 14 reason → fix table to the app. "Move the nudge closer to the start time" became the heads-up plus follow-up, because the nudge already fires at the start time.

## §4 Choosing a fix (pure functions in `src/rules/selectFix.ts`)

### 4.1 `selectFix`

Input: the reason, the time now, this user's past misses (reason and time) and their past `fix_events`.

1. If `reason === 'other'`, return `if_then`.
2. `ladder` is that reason's two fixes. Drop any fix the student **turned down twice or more** for this reason, where turned down means `dismissed` (Not now) or `other` (Try something else).
3. If a fix in the ladder has `worked` as its **most recent** outcome for this reason, return it with the badge **"This worked for you before."** If several have, return the one that worked most recently. A fix whose latest outcome is `not_worked` loses the badge.
4. If no fixes are left, return `if_then`.
5. `n` is the number of misses with this reason in the **14 days** up to now, counting this one.
6. If `n` is greater than the number of fixes left, return `if_then` (our ideas didn't stick, so the student writes their own). Otherwise return fix number `n`: step 1 for the first miss, step 2 for the second.

**Try something else:** the next fix in the ladder after the current one, then `if_then`, then back to step 1.

### 4.2 Outcomes (did the fix work?)

When a check-in is answered, look at this user's `fix_events` with choice `used` or `own_plan`, outcome still empty, and created in the 3 days before. For each one, if **this task started after the fix event was created**:
- `done` or `partly` → `outcome = 'worked'`
- `not_yet` → `outcome = 'not_worked'`

Also set `outcome_task_id`. Fix events with no qualifying check-in within 3 days stay empty (unknown). `dismissed` and `other` choices never get an outcome.

### 4.3 Unit tests that must pass

1. First `too_big` → `too_big_1`.
2. Second `too_big` within 14 days → `too_big_2`.
3. Third `too_big` within 14 days → `if_then`.
4. A `too_big` 20 days ago, then one now → `too_big_1` (the 14-day window).
5. `too_big_1` worked before → `too_big_1` with the badge, even on the second miss. If it then gets a `not_worked` outcome, the normal ladder applies again.
6. `too_big_1` turned down twice (Not now or Try something else) → the first `too_big` gives `too_big_2`.
7. Both `too_big` fixes turned down twice → `if_then`.
8. `other` → `if_then`.
9. "Try something else" from `too_big_1` → `too_big_2` → `if_then` → `too_big_1`.
10. Outcomes: done → worked; partly → worked; not_yet → not_worked; a task that started *before* the fix → no change; no check-in within 3 days → stays empty; a dismissed fix → never gets an outcome.

### 4.4 Best time of day (for `tired_1`)

Time-of-day buckets in local time: morning 5:00–11:59, afternoon 12:00–16:59, evening 17:00–21:59, night 22:00–4:59. Use the bucket with the highest share of `done` among answered check-ins, but only buckets with 3+ check-ins. With fewer than 5 answered check-ins in total, show nothing.

## §5 Personalization

### 5.1 "What's hardest for you?" (setup, changeable in Settings)

| Choice | What it changes |
|---|---|
| Getting started | The Plan placeholder becomes "e.g. First 10 minutes of the essay", and start nudges add "Just the first few minutes." |
| Losing track of time | The Start screen says "We'll tell you when time's up." and the check-in fires at the planned end (+0 instead of +5 min) |
| Forgetting what I planned | `extra_reminders` turns on (heads-up and follow-up) |
| Getting distracted | New tasks default to `tip = 'phone_away'` |

### 5.2 Scaffolding (step back when it's going well) — on the cut list

If the weekly goal was met **two weeks in a row**, This week shows once: "Two weeks in a row. Want fewer reminders?" with **Yes, fewer** (start nudges off, check-ins stay) or **Keep as is**.

### 5.3 Bad weeks (change the kind of help) — on the cut list

If the weekly goal was **not** met two weeks in a row, This week shows (at most once a week): "Tough couple of weeks? That happens." with **Make my goal lighter** (goal −1, minimum 2) and **Share my week**, plus one line: "If things feel heavy lately, talking to someone can help. MUN's Student Wellness and Counselling Centre is free for students." and a link to Support. It never says why, and never names a condition.

## §6 Safety

### 6.1 Crisis check (`src/rules/safety.ts`)

- **Runs on every free-text field before saving:** task titles, the "Something else" note, if-then plans and custom routines.
- **How it matches:** lowercase, curly apostrophes turned straight, other punctuation (hyphens too) replaced with spaces, spaces collapsed, then check for any phrase below **from the start of a word**. The phrase must begin the text or come right after a space (or after an apostrophe, so a quoted 'end it all' still counts). It can run on into the rest of a word on the right, so "self harming", "overdosed" and "suicidal thoughts" still match. Why: matching anywhere inside a word set off false alarms on everyday text, like "send it all to Sam" and "spend it all" looking like "end it all". (Changed Oct 21, 2026, approved by Promit.) After the first step, "self-harm" reads as "self harm". In the code, "punctuation" means anything that isn't a letter, a number, an apostrophe or a space, so symbols and emoji count too.
- **Starting list** (ask an MUN counsellor or clinician to review it before a public launch): suicide · suicidal · kill myself · killing myself · end my life · end it all · want to die · wanna die · don't want to live · dont want to live · don't want to be here anymore · no reason to live · better off dead · hurt myself · hurting myself · self harm · self-harm · selfharm · cut myself · cutting myself · overdose
- **Must not match** (write tests): "this exam is killing me", "dead tired", "I'm dying to finish this", "kill this assignment", "cut my study time".
- **On a match:** don't save the text and don't log it anywhere. Open the Support screen (S13) with the opening line in 6.2. When they come back, the field is empty and they can carry on. The app never tries to judge how serious it is, and no one on the team is notified. The "What we collect" screen says plainly that we can't respond to emergencies.
- A false alarm is fine: the Support screen is calm and helpful either way.

### 6.2 Support screen (S13) content

Opening line, only when opened by the crisis check: "It sounds like things might be really hard right now. You don't have to handle this alone."

Title: **Need to talk to someone?**
- **In danger right now?** Call 911. [Call 911 → `tel:911`]
- **Thinking about suicide, or worried about someone?** Call or text 9-8-8, any time, 24/7. [Call 9-8-8 → `tel:988`] [Text 9-8-8 → `sms:988`]
- **Mental health crisis (NL):** call 811 to talk to a nurse trained in crisis care, any time. [Call 811 → `tel:811`]
- **On campus and need urgent help:** Campus Enforcement and Patrol, 709-864-4100. [Call → `tel:+17098644100`]
- **MUN Student Wellness and Counselling Centre** (UC-5000): free, confidential counselling for MUN students. 709-864-8500. Same-day appointments: samedaycounselling@mun.ca. [Call → `tel:+17098648500`] [Email → `mailto:samedaycounselling@mun.ca`]
- Footer: "This app can't help in an emergency, but these people can."

Numbers were checked on Oct 20, 2026 against mun.ca (the Student Wellness and Counselling Centre pages and "Supports for Students in Distress"). Check them again before each tester round. These are Canada- and NL-specific. Any other country needs its own list (Bangladesh: Kaan Pete Roi).

### 6.3 Never

Name or hint at a condition, give a risk score, collect diagnoses, give treatment advice, or let any automated system answer a crisis message. Fixed rules only.

## §7 Notification text

| Type | Title | Body |
|---|---|---|
| Plan reminder (evening) | Plan tomorrow? | Takes a minute. Pick 1–3 small things. |
| Plan reminder (morning) | Plan today? | Takes a minute. Pick 1–3 small things. |
| Heads-up | In 10 minutes | {title} |
| Start nudge | Starting now? | {title} · {length} min |
| Start nudge with a tip or cue | Starting now? | {title} · {length} min, then a second line: the tip (`phone_away` → "Phone in your bag for this one?", `focus_or_move` → "Focus mode on, or somewhere new?", Getting started → "Just the first few minutes.") or the cue ("After {cue} — time to start.") |
| Several tasks at once | Starting now? | {n} things planned for now |
| Follow-up | Still on? | {title}. Even 5 minutes counts. |
| Check-in | How did it go? | Did you get to {title}? |
| Timer end | Time's up | How did {title} go? |

## §8 Screen text

**S1 Welcome.** Title: "When work piles up, it's easy to feel buried." Body: "Follow Through helps you do what you planned. And when a day goes sideways, it helps you fix the plan instead of feeling bad about it. One minute a day." Small print: "A student project from a MUN business course." Button: "Let's start"

**S2 What we collect.** Title: "What we collect"
- "Your plans: what you want to do and when"
- "Your check-ins: done or not, and what got in the way"
- "Which fixes you try"
- "Basic app use, like when you open the app"

"We don't collect your name, email, contacts or location, and we don't ask about health. We never sell your data or use it for ads. Your data is stored in Canada, and only our 4-person team can see it, under your tester code. You can delete everything anytime in Settings, and you can stop anytime."
"This isn't counselling, and we can't respond to emergencies. If you're struggling, Settings → Need to talk to someone? lists free 24/7 support."
Checkbox: "I'm 18 or older". Field: "Tester code". Button: "Start". Error: "Check the code we sent you."

**S3 Setup.**
- "What's hardest for you? Pick any. You can change this later." Options: Getting started · Losing track of time · Forgetting what I planned · Getting distracted.
- "How many days a week do you want to check in?" Hint: "4 is a good start. Missing a day doesn't reset anything."
- "When should we remind you to plan?" Hint: "Most people plan the evening before." Options: Evening · Morning, with a time.

**S4 Reminders.** Title: "Can we nudge you?" Body: "We'll send a quick nudge when it's time to start, and ask how it went after. You can change this anytime." Buttons: "Turn on reminders" · "Not now". Banner later: "Reminders are off, so we can't nudge you." Button: "Turn on"

**S5 Today.** Empty state: "Nothing planned yet. What are 1–3 things you want to get done today?" Button: "Plan today". Later: "Plan tomorrow". Section: "How did these go?" Week line: "This week: {n} of {goal} days"

**S6 Plan.** Title: "Plan today" / "Plan tomorrow". "What will you do?" Placeholder: "e.g. 10 practice questions from chapter 3". Tip for 1–2 word titles: "Tip: say what and how much. 'Study chem' → '10 practice questions from ch. 3'." "When will you start?" · "How long?" · "Add another". At 3 tasks: "Three is plenty. A short list is easier to finish." At a cap of 2: "Two today. A lighter plan is easier to finish." Double-time tip: "Tip: give it about twice the time you'd guess." Saved: "You're set. We'll nudge you at {time}." When rescheduling from a fix: "We'll plan it for tomorrow at {time}. You can change it."

**S7 Start.** "Starting now?" (or "Start now?" if the time has passed). Buttons: "Start" · "In 10 min" · "Not today". With Losing track of time: "We'll tell you when time's up."

**S8 Timer.** "{mm:ss} left". Buttons: "I'm done" · "Stop"

**S9 Check-in.** "Did you get to it?" under {title}. Buttons: "Done" · "Partly" · "Not yet".
- Done (rotate): "Nice. That's one done." / "Done. Nice work." / "That's done. One less thing."
- Done after a fix: "That fix worked. Saved to What works for me."
- Partly: "Some is way better than none." Buttons: "Plan the rest" · "Done for now"
- Not yet: "No problem. What got in the way?" with the six reason labels in §2. Note placeholder: "Want to say more? (optional)"

**S10 Fix.** Title: "Let's adjust." Secondary buttons: "Try something else" · "Make my own plan" · "Not now". Badge: "This worked for you before."

| Fix | Body | Main button |
|---|---|---|
| Shrink it | Big tasks are hard to start. Plan just the first 10 minutes. That counts. | Plan the first 10 minutes |
| Make it tiny | Pick the smallest step there is, like just opening your notes. Stopping after 5 minutes is fine. | Plan a 5-minute start |
| Get a heads-up | We'll remind you 10 minutes before, and once more if you haven't started. | Turn on extra reminders |
| Tie it to a routine | Link it to something you already do, like right after supper or when you get home from class. | Pick a routine |
| Phone out of reach | Put your phone in another room or in your bag for this one. A student we talked to says that's what works for him. | Try it next time |
| Block it, or move | Turn on your phone's Focus mode or a site blocker for the session, or study somewhere new, like the library. | Try it next time |
| Try a better time | Move it to a time when you usually have more energy. (+ "You finish the most in the {bucket}." when known) | Pick a new time |
| Go shorter | Make it a 10-minute session. Short sessions still count. | Make it 10 minutes |
| Plan fewer | Tomorrow, try 1 or 2 things instead of 3. A lighter plan is easier to finish. | Plan a lighter day |
| Give it more time | Most people underestimate how long tasks take. Try about twice your first guess. | Double the time |
| Make your own plan | Plans like "if this happens, then I'll do that" help people follow through. Fill in yours: | Save my plan |

If-then builder: "If ___, then I'll ___." Examples to tap: "If it's 7 pm and I'm on my phone, then I'll start a 25-minute timer." · "If I get home from class, then I'll open my notes right away." · "If I feel stuck, then I'll do just one question."

**S11 This week.** "{n} of {goal} days" · "Tasks done: {k}" · "What got in the way most: {reason label}" · "What works for me" (empty: "Fixes that work for you will show up here.") · "Try this: {fix title}" · Button: "Share my week". Share text: "This week I checked in on {n} of {goal} days and finished {k} tasks."

**S12 Settings.** Labels: What's hardest for me · Weekly goal · Plan reminder · Start nudges · Extra reminders · Quiet hours · Take a break · Need to talk to someone? · What we collect · Privacy · Delete my data · Tester code · Version · Send feedback.
- Break: "Taking a break is fine. Reminders are off until {date}."
- Delete, first confirm: "This deletes your plans, check-ins and settings. It can't be undone." Button: "Delete everything". Done: "Deleted. Thanks for trying Follow Through."

**S14 Welcome back.** "Welcome back. No catching up needed — let's just plan today." Buttons: "Plan today" · "Make this week's goal lighter"

**Errors.** Save failed: "Couldn't save. Check your connection and try again." Server problem: "Something went wrong on our side. Try again in a minute."
