// Every word the app shows lives here (CLAUDE.md rule 7), so it can be translated later.
// Screen text comes from docs/RULES.md §6.2 and §7–§8. Change it there first, then here.
// Placeholders like {time} are filled in with fill() below.

export const en = {
  appName: 'Follow Through',

  common: {
    back: 'Back',
    retry: 'Try again',
  },

  // Clock times are written like '7:00 pm' (src/lib/time.ts formatTime).
  time: {
    am: 'am',
    pm: 'pm',
    // Dates are written like 'Thursday, Nov 5' (src/lib/time.ts formatDate). Monday first.
    weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    date: '{weekday}, {month} {day}',
  },

  // S1 Welcome (first launch only)
  welcome: {
    title: 'When work piles up, it’s easy to feel buried.',
    body: 'Follow Through helps you do what you planned. And when a day goes sideways, it helps you fix the plan instead of feeling bad about it. One minute a day.',
    smallPrint: 'A student project from a MUN business course.',
    button: 'Let’s start',
  },

  // S2 What we collect (first launch only)
  collect: {
    title: 'What we collect',
    collected: [
      'Your tester code, settings and phone’s time zone',
      'Your plans: what you want to do and when',
      'Your check-ins: done or not, and what got in the way',
      'Which fixes you try',
      'Basic app use, like when you open the app',
    ],
    notCollected:
      'We don’t collect your name, email, contacts or location, and we don’t ask about health. We never sell your data or use it for ads. Your data is stored in Canada, and only our 4-person team can see it, under your tester code. You can delete everything anytime in Settings, and you can stop anytime.',
    notCounselling:
      'This isn’t counselling, and we can’t respond to emergencies. If you’re struggling, Settings → Need to talk to someone? lists free 24/7 support.',
    ageCheckbox: 'I’m 18 or older',
    codeLabel: 'Tester code',
    start: 'Start',
    codeError: 'Check the code we sent you.',
  },

  // S3 Setup (first launch; changeable later in Settings)
  setup: {
    hardestTitle: 'What’s hardest for you? Pick any. You can change this later.',
    hardest: {
      starting: 'Getting started',
      time: 'Losing track of time',
      forgetting: 'Forgetting what I planned',
      distraction: 'Getting distracted',
    },
    goalTitle: 'How many days a week do you want to check in?',
    goalHint: '4 is a good start. Missing a day doesn’t reset anything.',
    // RULES §8 said "When should we remind you to plan?" and "Most people plan the evening before."
    // Reworded Oct 21 (DECISIONS.md): RULES §1 bans "should" and comparing with other people.
    reminderTitle: 'When do you want to plan?',
    reminderHint: 'Planning the evening before makes mornings easier.',
    evening: 'Evening',
    morning: 'Morning',
    at: 'at {time}',
    changeTime: 'Change time',
    next: 'Next',
  },

  // S4 Reminders permission
  reminders: {
    title: 'Can we nudge you?',
    body: 'We’ll send a quick nudge when it’s time to start, and ask how it went after. You can change this anytime.',
    turnOn: 'Turn on reminders',
    notNow: 'Not now',
    offBanner: 'Reminders are off, so we can’t nudge you.',
    offBannerButton: 'Turn on',
    // The name Android shows for our notifications in the phone's settings.
    channelName: 'Reminders',
  },

  // S5 Today
  today: {
    title: 'Today',
    empty: 'Nothing planned yet. What are 1–3 things you want to get done today?',
    planToday: 'Plan today',
    planTomorrow: 'Plan tomorrow',
    howDidTheseGo: 'How did these go?',
    loadFailed: 'Couldn’t load your plan. Check your connection and try again.',
    tomorrowSection: 'Tomorrow',
    weekLine: 'This week: {n} of {goal} days',
    taskMeta: '{time} · {length} min',
    edit: 'Edit',
    status: {
      planned: 'Planned',
      started: 'Started',
      done: 'Done',
      partly: 'Partly',
      not_yet: 'Not yet',
      unanswered: 'No answer',
    },
  },

  // S6 Plan (add or edit a task)
  plan: {
    titleToday: 'Plan today',
    titleTomorrow: 'Plan tomorrow',
    titleEdit: 'Change your plan',
    dayToday: 'Today',
    dayTomorrow: 'Tomorrow',
    whatLabel: 'What will you do?',
    whatPlaceholder: 'e.g. 10 practice questions from chapter 3',
    whatPlaceholderStarting: 'e.g. First 10 minutes of the essay',
    titleTip: 'Tip: say what and how much. ‘Study chem’ → ‘10 practice questions from ch. 3’.',
    whenLabel: 'When will you start?',
    howLongLabel: 'How long?',
    minutes: '{n} min',
    addAnother: 'Add another',
    remove: 'Remove',
    threeIsPlenty: 'Three is plenty. A short list is easier to finish.',
    twoToday: 'Two today. A lighter plan is easier to finish.',
    save: 'Save',
    saved: 'You’re set. We’ll nudge you at {time}.',
    // When a fix opens Plan for tomorrow (RULES §8 S6).
    fromFix: 'We’ll plan it for tomorrow at {time}. You can change it.',
    // On the day after "Give it more time" (RULES §8 S6).
    doubleTip: 'Tip: give it about twice the time you’d guess.',
    delete: 'Delete',
    deleteConfirmTitle: 'Delete this plan?',
    deleteConfirmKeep: 'Keep it',
  },

  // Titles a fix or "Plan the rest" makes from the old one (RULES §3, §8 S9): "First 10 min: Essay".
  titlePrefixes: {
    first10: 'First 10 min: ',
    justOpen: 'Just open it: ',
    restOf: 'Rest of: ',
  },

  // S7 Start (RULES §8)
  start: {
    startingNow: 'Starting now?',
    startNow: 'Start now?',
    start: 'Start',
    snooze: 'In 10 min',
    notToday: 'Not today',
    // With "Losing track of time" (RULES §5.1)
    timeUpHint: 'We’ll tell you when time’s up.',
  },

  // S8 Focus timer (RULES §8)
  timer: {
    left: '{time} left',
    timeUp: 'Time’s up',
    done: 'I’m done',
    stop: 'Stop',
  },

  // The three tabs (PRODUCT.md §7)
  tabs: {
    today: 'Today',
    week: 'This week',
    settings: 'Settings',
  },

  // S14 Welcome back (RULES §8)
  welcomeBack: {
    text: 'Welcome back. No catching up needed — let’s just plan today.',
    planToday: 'Plan today',
    lighterGoal: 'Make this week’s goal lighter',
  },

  // S11 This week (RULES §8)
  week: {
    title: 'This week',
    days: '{n} of {goal} days',
    tasksDone: 'Tasks done: {k}',
    topReason: 'What got in the way most: {reason}',
    worksTitle: 'What works for me',
    worksEmpty: 'Fixes that work for you will show up here.',
    tryThis: 'Try this: {fix}',
    share: 'Share my week',
    // Never includes task titles (PRODUCT.md S11).
    shareText: 'This week I checked in on {n} of {goal} days and finished {k} tasks.',
    shareTextOne: 'This week I checked in on {n} of {goal} days and finished 1 task.',
  },

  // S12 Settings (RULES §8)
  settings: {
    title: 'Settings',
    hardest: 'What’s hardest for me',
    goal: 'Weekly goal',
    planReminder: 'Plan reminder',
    startNudges: 'Start nudges',
    extraReminders: 'Extra reminders',
    extraRemindersHint: 'A heads-up 10 minutes before, and once more if you haven’t started.',
    quietHours: 'Quiet hours',
    quietFrom: 'From',
    quietTo: 'To',
    takeBreak: 'Take a break',
    breakDays: { 1: '1 day', 3: '3 days', 7: '7 days' },
    onBreak: 'Taking a break is fine. Reminders are off until {date}.',
    endBreak: 'Turn reminders back on',
    support: 'Need to talk to someone?',
    whatWeCollect: 'What we collect',
    privacy: 'Privacy',
    deleteData: 'Delete my data',
    deleteFirst: 'This deletes your plans, check-ins and settings. It can’t be undone.',
    deleteSecond: 'Delete everything now?',
    deleteButton: 'Delete everything',
    deleteKeep: 'Keep it',
    deleted: 'Deleted. Thanks for trying Follow Through.',
    ok: 'OK',
    testerCode: 'Tester code',
    version: 'Version',
    feedback: 'Send feedback',
  },

  // S9 Check-in (RULES §2, §8)
  checkin: {
    question: 'Did you get to it?',
    done: 'Done',
    partly: 'Partly',
    notYet: 'Not yet',
    // One of these after Done, in turn.
    doneLines: ['Nice. That’s one done.', 'Done. Nice work.', 'That’s done. One less thing.'],
    fixWorked: 'That fix worked. Saved to What works for me.',
    partlyLine: 'Some is way better than none.',
    planRest: 'Plan the rest',
    doneForNow: 'Done for now',
    notYetLine: 'No problem. What got in the way?',
    reasons: {
      too_big: 'It felt too big',
      forgot: 'I forgot',
      distracted: 'I got distracted',
      tired: 'I was too tired',
      out_of_time: 'I ran out of time',
      other: 'Something else',
    },
    notePlaceholder: 'Want to say more? (optional)',
    next: 'Next',
  },

  // S10 Fix (RULES §3, §8). One card per fix: title, body, main button.
  fix: {
    title: 'Let’s adjust.',
    tryElse: 'Try something else',
    ownPlan: 'Make my own plan',
    notNow: 'Not now',
    workedBefore: 'This worked for you before.',
    cards: {
      too_big_1: {
        title: 'Shrink it',
        body: 'Big tasks are hard to start. Plan just the first 10 minutes. That counts.',
        button: 'Plan the first 10 minutes',
      },
      too_big_2: {
        title: 'Make it tiny',
        body: 'Pick the smallest step there is, like just opening your notes. Stopping after 5 minutes is fine.',
        button: 'Plan a 5-minute start',
      },
      forgot_1: {
        title: 'Get a heads-up',
        body: 'We’ll remind you 10 minutes before, and once more if you haven’t started.',
        button: 'Turn on extra reminders',
      },
      forgot_2: {
        title: 'Tie it to a routine',
        body: 'Link it to something you already do, like right after supper or when you get home from class.',
        button: 'Pick a routine',
      },
      distracted_1: {
        title: 'Phone out of reach',
        body: 'Put your phone in another room or in your bag for this one. A student we talked to says that’s what works for him.',
        button: 'Try it next time',
      },
      distracted_2: {
        title: 'Block it, or move',
        body: 'Turn on your phone’s Focus mode or a site blocker for the session, or study somewhere new, like the library.',
        button: 'Try it next time',
      },
      tired_1: {
        title: 'Try a better time',
        body: 'Move it to a time when you usually have more energy.',
        button: 'Pick a new time',
      },
      tired_2: {
        title: 'Go shorter',
        body: 'Make it a 10-minute session. Short sessions still count.',
        button: 'Make it 10 minutes',
      },
      out_of_time_1: {
        title: 'Plan fewer',
        body: 'Tomorrow, try 1 or 2 things instead of 3. A lighter plan is easier to finish.',
        button: 'Plan a lighter day',
      },
      out_of_time_2: {
        title: 'Give it more time',
        body: 'Most people underestimate how long tasks take. Try about twice your first guess.',
        button: 'Double the time',
      },
      if_then: {
        title: 'Make your own plan',
        body: 'Plans like “if this happens, then I’ll do that” help people follow through. Fill in yours:',
        button: 'Save my plan',
      },
    },
    // Added to "Try a better time" once there are 5+ answered check-ins (RULES §4.4).
    bestTime: 'You finish the most {when}.',
    dayParts: {
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
    // The if-then builder: "If ___, then I'll ___."
    ifLabel: 'If',
    thenLabel: 'then I’ll',
    ifThenTemplate: 'If {if}, then I’ll {then}.',
    ifThenExamples: [
      { if: 'it’s 7 pm and I’m on my phone', then: 'start a 25-minute timer' },
      { if: 'I get home from class', then: 'open my notes right away' },
      { if: 'I feel stuck', then: 'do just one question' },
    ],
    // "Tie it to a routine": each one becomes the nudge's "After {cue} — time to start."
    routines: [
      { label: 'After supper', cue: 'supper' },
      { label: 'After my last class', cue: 'my last class' },
      { label: 'When I get home', cue: 'I get home' },
      { label: 'After lunch', cue: 'lunch' },
    ],
    customRoutine: 'Something else',
    customRoutineLabel: 'After…',
    customRoutinePlaceholder: 'e.g. the gym',
    routineTime: 'About what time is that?',
  },

  // Notification text (RULES §7). {title} is the task's title, {length} its minutes.
  notifications: {
    planTodayTitle: 'Plan today?',
    planTomorrowTitle: 'Plan tomorrow?',
    planBody: 'Takes a minute. Pick 1–3 small things.',
    headsUpTitle: 'In 10 minutes',
    headsUpBody: '{title}',
    startTitle: 'Starting now?',
    startBody: '{title} · {length} min',
    startGroupBody: '{n} things planned for now',
    // The second line of a start nudge: the task's own plan, its cue, its tip, or the
    // "Getting started" line (RULES §5.1, §7).
    tipPhoneAway: 'Phone in your bag for this one?',
    tipFocusOrMove: 'Focus mode on, or somewhere new?',
    startingLine: 'Just the first few minutes.',
    cueLine: 'After {cue} — time to start.',
    followUpTitle: 'Still on?',
    followUpBody: '{title}. Even 5 minutes counts.',
    checkinTitle: 'How did it go?',
    checkinBody: 'Did you get to {title}?',
    timerTitle: 'Time’s up',
    timerBody: 'How did {title} go?',
  },

  // S13 Need to talk to someone? (RULES §6.2). Numbers checked Oct 20, 2026 against mun.ca.
  // Re-check them before each tester round.
  support: {
    title: 'Need to talk to someone?',
    crisisOpening:
      'It sounds like things might be really hard right now. You don’t have to handle this alone.',
    dangerTitle: 'In danger right now?',
    dangerBody: 'Call 911.',
    call911: 'Call 911',
    suicideTitle: 'Thinking about suicide, or worried about someone?',
    suicideBody: 'Call or text 9-8-8, any time, 24/7.',
    call988: 'Call 9-8-8',
    text988: 'Text 9-8-8',
    nlTitle: 'Mental health crisis (NL)',
    nlBody: 'Call 811 to talk to a nurse trained in crisis care, any time.',
    call811: 'Call 811',
    campusTitle: 'On campus and need urgent help?',
    campusBody: 'Campus Enforcement and Patrol, 709-864-4100.',
    callCampus: 'Call Campus Enforcement',
    swccTitle: 'MUN Student Wellness and Counselling Centre (UC-5000)',
    swccBody:
      'Free, confidential counselling for MUN students. 709-864-8500. Same-day appointments: samedaycounselling@mun.ca.',
    callSwcc: 'Call the Counselling Centre',
    emailSwcc: 'Email same-day counselling',
    footer: 'This app can’t help in an emergency, but these people can.',
    back: 'Back',
  },

  // Shown instead of the app when .env is missing or wrong (a developer problem, not a student one).
  configProblem: {
    missingEnv:
      'The Supabase settings are missing. Copy .env.example to .env, fill in the two values, then restart Expo.',
    badUrl:
      'The Supabase URL in .env doesn’t look right. It needs to start with https://, like https://abcd.supabase.co.',
    secretKey:
      'This is a secret key. It must never go in the app, and it was already copied into it. In Supabase, go to Project Settings → API Keys and delete this key (for the old service_role key, turn off the legacy keys there). Then put the publishable key in .env and restart Expo.',
  },

  errors: {
    saveFailed: 'Couldn’t save. Check your connection and try again.',
    server: 'Something went wrong on our side. Try again in a minute.',
  },
} as const;

// Fills {name} placeholders: fill('{n} of {goal}', { n: 2, goal: 4 }) → '2 of 4'.
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
