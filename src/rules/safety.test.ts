import { CRISIS_PHRASES, isCrisisText, normalizeForCrisisCheck } from './safety';

describe('CRISIS_PHRASES', () => {
  // Guards against an accidental edit. Changing the list should be a conscious choice
  // that starts in RULES.md §6.1.
  test('is the RULES.md §6.1 starting list, in order', () => {
    expect(CRISIS_PHRASES).toEqual([
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
      'dont want to be here anymore',
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
    ]);
  });
});

describe('normalizeForCrisisCheck', () => {
  test('lowercases, collapses whitespace and trims', () => {
    expect(normalizeForCrisisCheck('  Kill\n\t  MYSELF  ')).toBe('kill myself');
  });

  test('turns curly apostrophes straight and keeps apostrophes', () => {
    expect(normalizeForCrisisCheck('I don’t ‘want’')).toBe("i don't 'want'");
  });

  test('turns punctuation and hyphens into spaces', () => {
    expect(normalizeForCrisisCheck('self-harm!!')).toBe('self harm');
    expect(normalizeForCrisisCheck('want...to—die?')).toBe('want to die');
    expect(normalizeForCrisisCheck('"kill_myself"')).toBe('kill myself');
  });

  test('treats symbols and emoji like punctuation', () => {
    expect(normalizeForCrisisCheck('kill+myself 😭')).toBe('kill myself');
    expect(normalizeForCrisisCheck('want😭to die')).toBe('want to die');
  });

  test('keeps numbers and letters from other languages', () => {
    expect(normalizeForCrisisCheck('Café 2 Ñu')).toBe('café 2 ñu');
  });

  test('gives an empty string for empty or punctuation-only text', () => {
    expect(normalizeForCrisisCheck('')).toBe('');
    expect(normalizeForCrisisCheck('  !!! --- ')).toBe('');
  });
});

describe('isCrisisText', () => {
  test.each(CRISIS_PHRASES)(
    'matches "%s" alone, in a sentence, in capitals and with punctuation',
    (phrase) => {
      expect(isCrisisText(phrase)).toBe(true);
      expect(isCrisisText(`some days ${phrase} is all I think about`)).toBe(true);
      expect(isCrisisText(phrase.toUpperCase())).toBe(true);
      expect(isCrisisText(phrase.replace(/'/g, '’'))).toBe(true);
      expect(isCrisisText(`${phrase.replace(/ /g, '-')}!`)).toBe(true);
      expect(isCrisisText(`...${phrase.replace(/ /g, '   ')}?!`)).toBe(true);
    },
  );

  test('matches curly apostrophes', () => {
    expect(isCrisisText('I don’t want to live')).toBe(true);
    expect(isCrisisText('I don‘t want to live')).toBe(true);
    expect(isCrisisText('I DON’T WANT TO BE HERE ANYMORE')).toBe(true);
  });

  test('matches punctuation, hyphens and extra spaces', () => {
    expect(isCrisisText('self-harm')).toBe(true);
    expect(isCrisisText('kill-myself!')).toBe(true);
    expect(isCrisisText('want   to   die')).toBe(true);
    expect(isCrisisText('Better.Off.Dead')).toBe(true);
  });

  test('matches when the phrase runs on into the rest of a word', () => {
    expect(isCrisisText('self harming')).toBe(true);
    expect(isCrisisText('thinking about self-harming again')).toBe(true);
    expect(isCrisisText('overdosed')).toBe(true);
    expect(isCrisisText('suicidal thoughts')).toBe(true);
  });

  test('matches a quoted phrase', () => {
    expect(isCrisisText("I just want to 'end it all'")).toBe(true);
    expect(isCrisisText('‘end it all’')).toBe(true);
    expect(isCrisisText('"kill myself"')).toBe(true);
  });

  test('matches when an emoji sits right before the phrase', () => {
    expect(isCrisisText('😭want to die')).toBe(true);
  });

  // RULES.md §6.1 "Must not match".
  test.each([
    'this exam is killing me',
    'dead tired',
    "I'm dying to finish this",
    'kill this assignment',
    'cut my study time',
  ])('does not match "%s"', (text) => {
    expect(isCrisisText(text)).toBe(false);
  });

  // Matching starts only at the start of a word (changed Oct 21, 2026, approved by Promit).
  test.each(['send it all to Sam', 'spend it all on textbooks', 'attend it all', 'trend it all'])(
    'does not match a phrase hidden inside a word: "%s"',
    (text) => {
      expect(isCrisisText(text)).toBe(false);
    },
  );

  test('does not match empty or whitespace-only text', () => {
    expect(isCrisisText('')).toBe(false);
    expect(isCrisisText('   ')).toBe(false);
    expect(isCrisisText('\n\t ')).toBe(false);
    expect(isCrisisText('!!! ---')).toBe(false);
  });

  test('does not match ordinary study plans', () => {
    expect(isCrisisText('Read chapter 4 for BUSI 3630')).toBe(false);
    expect(isCrisisText("If it's 7 pm, then I'll open my notes")).toBe(false);
  });

  // Known false alarms. They are accepted because a false alarm only shows the calm Support
  // screen (RULES.md §6.1). They are here so the counsellor review can see them.
  test('known false alarms still match', () => {
    expect(isCrisisText('cut myself some slack')).toBe(true);
    expect(isCrisisText('I want to diet')).toBe(true);
  });
});
