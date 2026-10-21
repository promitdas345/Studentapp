# EVIDENCE — why v1 looks the way it does

Interviewees are codes only (P1–P6). The course's Letter of Information promises confidentiality, so names never go in this repo. Quotes are from the team's raw notes. P1–P3's notes were written by the interviewer, partly in third person. P5 and P6 typed their own answers.

## 1. What six MUN students told us (round 1, Oct 2026)

**The tally.** 5 of 6 named managing time as their biggest challenge before we mentioned it, and 1 of 6 named focusing. 4 of 6 told the same pile-up story. All 6 already use something: a to-do list, Google Calendar, a laptop calendar and notes app, a semester calendar, an agenda, or the phone in a backpack.

**Our validation deck's verdicts (Oct 20):**
- The "keeping up" problem (H2): **yes, so far**.
- The "can't get started" problem (H1): **not really**. Only one led with it, his phone fix works, and nobody said "guilty".
- First-years as the segment: **not yet**, because nobody's year was recorded.
- Early adopters: **mostly**. Everyone has a fix, but only one gave a date in the last 6 months.
- Pass line 1 (they raise the problem first): **passed, 6 of 6**. Pass line 2 (3+ tried a fix recently and agree to test): **not scored, 0 confirmed**, because the wrap-up questions were skipped.

**Patterns, in their words:**

| Pattern | What they said |
|---|---|
| One slip snowballs | P1: slipping on one or two assignments "puts you behind for the rest of the semester" · P2: "it starts piling up… you get panicked" (spelling fixed) · P1: work builds to "a breaking point" |
| The feeling is overwhelm, not guilt | P6: "I get overwhelmed and that's when I start to forget about some deadlines" · P5: "An overwhelming schedule to balance creates more stress" · P1: procrastinating brings "a lot of anxiety" |
| Their fix only partly works | P5: "It's better than nothing" and "it only helps so much" · P2: "To some extent, yes, but sometimes no" · P4: "Works well enough" · P6: "This solution has helped a little so far" |
| Planning tools take too much effort | P1: Google Calendar is "too much barrier to entry" and "the less time you do managing yourself the better" · P4: "too many steps to put stuff on the calendar" |
| Plans break and don't get fixed | P2 "hasn't tried adjusting for it, pushes things until night time, may affect sleep schedule" |
| Deadlines slip through | P6 forgot an assignment due Sunday night "until about an hour before" · P4 misses what he didn't write in |
| Underestimating time | P4: "Underestimate how much time a task takes" |
| Phone out of reach works | P3: keeping the phone in his backpack or another room "does work" (the laptop is the harder distraction) |
| Wants something personal | P6: "A more personalized solution would help a lot more to keep track of everything" |

**What's still unproven, and why v1 is a test:**
- **The fix after a miss is our guess, not something they asked for.** Only P3 mentioned it ("feedback that lets you know why you were not able to focus"), and only after a "would you be open to a solution" question. P2's "hasn't tried adjusting" supports the idea, but weakly.
- The start nudge fits the evidence less well than the fix after a miss, because "can't get started" wasn't confirmed. Measure whether nudges get opened, and keep them easy to turn off.
- Nobody was asked about paying, so we don't know who pays.
- Several want due dates tracked (P4, P6). That's Shovel's ground, and the decision is open (DECISIONS.md).
- Whether they use iPhone or Android isn't known. Ask while recruiting.

## 2. Research behind the design rules

| Finding | Source | What it means for v1 |
|---|---|---|
| 80–95% of college students procrastinate, and about half do so consistently | Steel 2007, *Psychological Bulletin* | Big, common problem |
| Procrastination is short-term mood repair (avoiding bad feelings now) | Sirois & Pychyl 2013 | A planner alone won't fix it. Starting has to feel easier (shrink-it fixes, short sessions). |
| First-years who forgave themselves for procrastinating procrastinated less before the next exam | Wohl, Pychyl & Bennett 2010 | The no-guilt tone, and "Welcome back" |
| If-then plans have a medium-to-large effect on reaching goals (d = 0.65, 94 tests) | Gollwitzer & Sheeran 2006 | The if-then fixes and "Make my own plan" |
| Monitoring progress helps (d ≈ 0.40), more so when it's recorded or reported to others | Harkin et al. 2016, *Psychological Bulletin* | Check-ins, the weekly view, Share my week |
| Habits took a median of ~66 days, and missing one day didn't materially hurt | Lally et al. 2010 | Weekly goals instead of daily streaks |
| A course with leaderboards and badges had lower motivation and exam grades | Hanus & Fox 2015 | No leaderboards or badges |
| Practice testing and spacing work best, while rereading and highlighting don't | Dunlosky et al. 2013 | Examples use practice questions |
| Median 30-day retention of mental-health apps was 3.3% | Baumel et al. 2019, *JMIR* | Retention is the biggest risk, so measure coming back after misses |
| Executive-function skills keep developing into early adulthood, and support should move from dependence to gradual independence | Harvard Center on the Developing Child | Scaffolding: step back as they do well |
| Self-set app limits cut time on distracting apps by about 16% (22 min/day) | Allcott, Gentzkow & Song 2022, *AER* | Phone tools help a bit, but we don't build blocking |
| People underestimate how long tasks take (the "planning fallacy") | Buehler, Griffin & Ross 1994, *JPSP* | The "Give it more time" fix (and P4 said it) |

## 3. Competitors (checked Oct 14, 2026)

- **Shovel** (study planner, web and iPhone, $9.79/month or $39/year): time estimates, warnings before you run short, due-date sync with Canvas, Brightspace and Moodle, reminders and a streak. It owns the **planning half**. We found no "why did you miss it", no if-then fix, no no-guilt restart and nothing by text. Purdue gives it to all students free, and it's on D2L's Brightspace IntegrationHub.
- **ChatGPT:** free users can have up to 3 scheduled tasks, each repeating at most daily (since Aug 25, 2026). It can remind, but it doesn't run check-in → why → fix by itself. **OpenAI Dots** (always-on agents, Pro and Business Premium plans only for now) is the one to watch if it reaches cheap plans and texting.
- **Tiimo** (visual planner for neurodivergent people, does AI reflections) · **Opal** (blocker, 4M+ users) · **LeechBlock NG** (free site blocker) · the phone's own Focus and Screen Time · **Finch** (self-care pet app).
- Our weakest point is being **hard to copy**: any chatbot can send check-in texts. The moat has to come from what we learn about which fixes work for whom, plus trust and distribution (universities).

## 4. Why v1 is built this way

| Decision | Evidence |
|---|---|
| Lead with the pile-up feeling, not features | Overwhelm, panic and stress in 4 of 6 interviews. BUSI 3630 Lesson 12: problems carry the strongest emotions. |
| The fix after a miss is the core | The pain starts after a slip. Shovel and ChatGPT don't adapt when you fail. |
| Under a minute a day | Calendars were "too much barrier to entry" and "too many steps" |
| No guilt, weekly goal, no streaks | Wohl 2010, Lally 2010, Hanus & Fox 2015. Nobody said "guilty". |
| Fixes change with the reason and repeat what worked | P6 wants something "more personalized". Gollwitzer & Sheeran 2006. |
| No blocking in v1 | P3's phone fix already works, LeechBlock is free, and the phone has Focus modes |
| No AI in v1 | The rules are enough to test the loop. It's cheaper, faster and private. Pick models later by testing on real replies. |
| No diagnoses, ever | Naming a condition could make it a regulated medical device (Health Canada SaMD guidance) and would be wrong most of the time |
