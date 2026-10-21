// Every word the app shows lives here (CLAUDE.md rule 7), so it can be translated later.
// Screen text comes from docs/RULES.md §6.2 and §7–§8. Change it there first, then here.
// Placeholders like {time} are filled in with fill() below.

export const en = {
  appName: 'Follow Through',

  common: {
    back: 'Back',
    retry: 'Try again',
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
    delete: 'Delete',
    deleteConfirmTitle: 'Delete this plan?',
    deleteConfirmKeep: 'Keep it',
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
