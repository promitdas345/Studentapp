// The crisis check (RULES.md §6.1, CLAUDE.md rule 2).
// It runs on every free-text field before saving: task titles, the "Something else" note,
// if-then plans and custom routines. On a match the app opens the Support screen (S13)
// and throws the text away.
//
// A match, and the text that matched, is NEVER saved, logged or sent anywhere: not to
// Supabase, not to events, not to the console. This file only answers yes or no.
//
// These are fixed rules on purpose. The app never judges how serious something is and never
// tries to counsel anyone (RULES.md §6.3). A false alarm is fine, because Support is calm either way.
//
// Pure (no network, no clock, no React or Expo), so it can be unit tested.

// The starting list from RULES.md §6.1, in the same order.
// An MUN counsellor or clinician must review this list before any public launch.
// To change it, change RULES.md §6.1 first, then this list, then the tests.
export const CRISIS_PHRASES: readonly string[] = [
  'suicide',
  'suicidal',
  'kill myself',
  'killing myself',
  'end my life',
  'end it all',
  'want to die',
  'wanna die',
  "don't want to live",
  'dont want to live',
  "don't want to be here anymore",
  'no reason to live',
  'better off dead',
  'hurt myself',
  'hurting myself',
  'self harm',
  'self-harm',
  'selfharm',
  'cut myself',
  'cutting myself',
  'overdose',
];

// Phones often type curly apostrophes (’ and ‘). Turn them straight so "don’t" matches "don't".
const CURLY_APOSTROPHES = /[‘’]/g;

// Anything that isn't a letter, a number, an apostrophe or whitespace counts as punctuation here.
// That includes hyphens, symbols like + and ~, and emoji, so "self-harm", "kill-myself!" and
// "want😭to die" all read as plain words. Apostrophes stay so "don't want to live" still works.
const PUNCTUATION = /[^\p{L}\p{M}\p{N}'\s]/gu;

const WHITESPACE_RUN = /\s+/g;

// Lowercase, straighten apostrophes, turn other punctuation into spaces, collapse spaces, trim.
// The phrase list goes through the same steps, so "self-harm" in the list becomes "self harm".
export function normalizeForCrisisCheck(text: string): string {
  return text
    .toLowerCase()
    .replace(CURLY_APOSTROPHES, "'")
    .replace(PUNCTUATION, ' ')
    .replace(WHITESPACE_RUN, ' ')
    .trim();
}

// Worked out once. Duplicates are dropped ("self harm" and "self-harm" end up the same).
const NORMALIZED_PHRASES: readonly string[] = [
  ...new Set(CRISIS_PHRASES.map(normalizeForCrisisCheck)),
].filter((phrase) => phrase.length > 0);

// True if the text contains any crisis phrase, starting at the start of a word.
export function isCrisisText(text: string): boolean {
  const normalized = normalizeForCrisisCheck(text);
  if (normalized === '') return false;
  return NORMALIZED_PHRASES.some((phrase) => hasPhraseAtWordStart(normalized, phrase));
}

// Matching starts only at the start of a word, so "send it all to Sam" and "spend it all"
// don't look like "end it all" (changed Oct 21, 2026, approved by Promit).
// On the right the phrase may run on into the rest of a word, so "self harming",
// "overdosed" and "suicidal thoughts" still match.
function hasPhraseAtWordStart(text: string, phrase: string): boolean {
  let index = text.indexOf(phrase);
  while (index !== -1) {
    if (startsAWord(text, index)) return true;
    index = text.indexOf(phrase, index + 1);
  }
  return false;
}

// A word starts at the beginning of the text, after a space, or after an apostrophe.
// The apostrophe counts because people quote words ('end it all'), and the quote mark
// is kept as an apostrophe by the steps above.
function startsAWord(text: string, index: number): boolean {
  if (index === 0) return true;
  const before = text[index - 1];
  return before === ' ' || before === "'";
}
