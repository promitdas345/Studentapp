// S10 Fix: "Let's adjust." One fix card picked by selectFix (RULES.md §4), plus Try something else,
// Make my own plan and Not now (PRODUCT.md S10). Every card shown gets a fix_events row, and every
// choice is saved on it. The main button changes what RULES.md §3 says, then opens Plan for
// tomorrow at the same start time, prefilled; the new task points back at the card (from_fix_event).
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Button, Chip, Notice, Row, Screen, Title, colors } from '../../components/ui';
import { en, fill } from '../../copy/en';
import { loadProblem, saveProblem } from '../../data/errors';
import { fetchFixEvents, insertFixEvent, setFixChoice } from '../../data/fixEvents';
import { updateMyProfile } from '../../data/profile';
import { fetchAnsweredSince, fetchMissesSince, fetchTask } from '../../data/tasks';
import type { FixChoice, FixEvent, MissReason, Task } from '../../data/types';
import { goBack } from '../../lib/nav';
import { useSession } from '../../lib/session';
import { addDays, localDate } from '../../lib/time';
import { FIXES, planHintFor, rescheduleFor, type FixId } from '../../rules/fixes';
import { bestTimeOfDay, type TaskForBestTime } from '../../rules/insights';
import { CUE_MAX, encodePrefill } from '../../rules/plan';
import { isCrisisText } from '../../rules/safety';
import { MISS_WINDOW_DAYS, nextFix, selectFix } from '../../rules/selectFix';

const copy = en.fix;
const DAY_MS = 24 * 60 * 60 * 1000;
// How far back "best time of day" looks (RULES.md §4.4 doesn't limit it; this keeps the query small).
const BEST_TIME_DAYS = 60;
// Each half of "If ___, then I'll ___." The whole sentence must fit tasks.if_then (160).
const IF_THEN_PART_MAX = 70;

type Card = { fixId: FixId; workedBefore: boolean; eventId: string };
type FirstCard = { found: Task & { reason: MissReason }; card: Card; answered: TaskForBestTime[] };
// What's on screen: the card, the routine picker ("Tie it to a routine"), or the if-then builder.
type Stage = 'card' | 'routine' | 'ifThen';

export default function Fix() {
  const { profile, setProfile } = useSession();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const [task, setTask] = useState<(Task & { reason: MissReason }) | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  // Answered check-ins, for the best time of day on "Try a better time" (RULES.md §4.4).
  const [answered, setAnswered] = useState<TaskForBestTime[]>([]);
  const [stage, setStage] = useState<Stage>('card');
  const [ifPart, setIfPart] = useState('');
  const [thenPart, setThenPart] = useState('');
  const [customCue, setCustomCue] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // The first card's row, kept so that running this effect twice never shows (and saves) two cards.
  const firstCard = useRef<Promise<FirstCard | null> | null>(null);

  useEffect(() => {
    let active = true;
    firstCard.current ??= (async () => {
      const found = await fetchTask(taskId);
      // Only a task answered "Not yet" gets a fix (PRODUCT.md S5: unanswered tasks don't).
      if (!found || found.status !== 'not_yet' || !found.reason) return null;
      const missed = { ...found, reason: found.reason };
      const now = new Date();
      const [misses, history, answered] = await Promise.all([
        fetchMissesSince(new Date(now.getTime() - MISS_WINDOW_DAYS * DAY_MS).toISOString()),
        fetchFixEvents(),
        fetchAnsweredSince(new Date(now.getTime() - BEST_TIME_DAYS * DAY_MS).toISOString()),
      ]);
      const pick = selectFix({
        reason: missed.reason,
        now,
        misses: misses.flatMap((m) => (m.reason && m.checked_in_at ? [{ reason: m.reason, at: m.checked_in_at }] : [])),
        fixEvents: history,
      });
      const shown = await insertFixEvent({ task_id: missed.id, reason: missed.reason, fix_id: pick.fixId });
      return { found: missed, card: { ...pick, eventId: shown.id }, answered };
    })();
    firstCard.current.then(
      (loaded) => {
        if (!active) return;
        if (!loaded) {
          router.replace('/');
          return;
        }
        setTask(loaded.found);
        setCard(loaded.card);
        setAnswered(loaded.answered);
      },
      (error) => {
        firstCard.current = null; // so "Try again" starts over
        if (active) setProblem(loadProblem(error));
      },
    );
    return () => {
      active = false;
    };
  }, [taskId, attempt]);

  if (!profile) return null;

  if (!task || !card) {
    return (
      <Screen>
        {problem ? (
          <>
            <Notice>{problem}</Notice>
            <Button
              label={en.common.retry}
              onPress={() => {
                setProblem(null);
                setAttempt((n) => n + 1);
              }}
            />
            <Button label={en.common.back} kind="quiet" onPress={goBack} />
          </>
        ) : (
          <ActivityIndicator size="large" style={styles.spinner} />
        )}
      </Screen>
    );
  }

  const tz = profile.timezone;
  const tomorrow = addDays(localDate(new Date(), tz), 1);
  const fix = FIXES[card.fixId];
  const words = copy.cards[card.fixId];
  const bestTime = card.fixId === 'tired_1' ? bestTimeOfDay(answered, tz) : null;

  // Runs one step that saves something; on a problem, shows the message and stays on the screen.
  const run = async (step: () => Promise<void>) => {
    setBusy(true);
    setProblem(null);
    try {
      await step();
    } catch (error) {
      setProblem(saveProblem(error));
    } finally {
      setBusy(false);
    }
  };

  const choose = (choice: FixChoice) => setFixChoice(card.eventId, choice);

  // Opens Plan for tomorrow, prefilled (RULES.md §3 "Reschedule"). A fix the student replaced with
  // their own plan reschedules without the fix's changes.
  const openPlan = (
    fixId: FixId,
    extra: { cue?: string | null; ifThen?: string | null; routineTime?: boolean } = {},
  ) => {
    const plan = rescheduleFor(fixId, task, tz);
    router.replace({
      pathname: '/plan',
      params: {
        day: 'tomorrow',
        prefill: encodePrefill({
          title: plan.title,
          time: plan.time,
          length: plan.length,
          tip: plan.tip,
          cue: extra.cue ?? null,
          ifThen: extra.ifThen ?? null,
          fromFixEvent: card.eventId,
          pickTime: plan.pickTime || Boolean(extra.routineTime),
          routineTime: Boolean(extra.routineTime),
        }),
      },
    });
  };

  // The main button. (The if-then card's button is "Save my plan", under the builder.)
  const applyFix = () =>
    run(async () => {
      await choose('used');
      if (fix.asks === 'routine') {
        setStage('routine');
        return;
      }
      const hint = planHintFor(card.fixId, tomorrow);
      if (fix.extraReminders || hint) {
        setProfile(
          await updateMyProfile(profile.user_id, {
            ...(fix.extraReminders ? { extra_reminders: true } : {}),
            ...(hint ? { plan_hint: hint } : {}),
          }),
        );
      }
      openPlan(card.fixId);
    });

  const tryElse = () =>
    run(async () => {
      await choose('other');
      const next = nextFix(task.reason, card.fixId);
      const shown: FixEvent = await insertFixEvent({ task_id: task.id, reason: task.reason, fix_id: next });
      setCard({ fixId: next, workedBefore: false, eventId: shown.id });
      setStage('card');
      setCustomOpen(false);
    });

  const ownPlan = () =>
    run(async () => {
      await choose('own_plan');
      setStage('ifThen');
    });

  const notNow = () =>
    run(async () => {
      await choose('dismissed');
      goBack();
    });

  // "Save my plan": the if-then card's own button ("used"), or after "Make my own plan" (already saved).
  const saveIfThen = async (choice: FixChoice | null) => {
    const sentence = fill(copy.ifThenTemplate, { if: tidy(ifPart), then: tidy(thenPart) });
    // The crisis check runs on the plan before anything is saved (RULES.md §6.1).
    if (isCrisisText(sentence)) {
      setIfPart('');
      setThenPart('');
      router.push({ pathname: '/support', params: { crisis: '1' } });
      return;
    }
    if (choice) await choose(choice);
    openPlan('if_then', { ifThen: sentence });
  };

  const pickRoutine = (cue: string) => {
    if (isCrisisText(cue)) {
      setCustomCue('');
      router.push({ pathname: '/support', params: { crisis: '1' } });
      return;
    }
    openPlan(card.fixId, { cue, routineTime: true });
  };

  const ifThenReady = tidy(ifPart).length > 0 && tidy(thenPart).length > 0;
  const showBuilder = stage === 'ifThen' || card.fixId === 'if_then';

  return (
    <Screen>
      <Title>{copy.title}</Title>

      {stage === 'routine' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{words.title}</Text>
          {copy.routines.map((routine) => (
            <Button key={routine.cue} label={routine.label} kind="secondary" onPress={() => pickRoutine(routine.cue)} />
          ))}
          <Button label={copy.customRoutine} kind="quiet" onPress={() => setCustomOpen(true)} />
          {customOpen ? (
            <>
              <Text style={styles.label}>{copy.customRoutineLabel}</Text>
              <TextInput
                value={customCue}
                onChangeText={setCustomCue}
                placeholder={copy.customRoutinePlaceholder}
                placeholderTextColor={colors.muted}
                maxLength={CUE_MAX}
                autoFocus
                accessibilityLabel={copy.customRoutineLabel}
                style={styles.input}
              />
              <Button
                label={en.checkin.next}
                onPress={() => pickRoutine(tidy(customCue))}
                disabled={tidy(customCue).length === 0}
              />
            </>
          ) : null}
        </View>
      ) : showBuilder ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{copy.cards.if_then.title}</Text>
          <Body>{copy.cards.if_then.body}</Body>
          <Text style={styles.label}>{copy.ifLabel}</Text>
          <TextInput
            value={ifPart}
            onChangeText={setIfPart}
            maxLength={IF_THEN_PART_MAX}
            accessibilityLabel={copy.ifLabel}
            style={styles.input}
          />
          <Text style={styles.label}>{copy.thenLabel}</Text>
          <TextInput
            value={thenPart}
            onChangeText={setThenPart}
            maxLength={IF_THEN_PART_MAX}
            accessibilityLabel={copy.thenLabel}
            style={styles.input}
          />
          <Row wrap>
            {copy.ifThenExamples.map((example) => (
              <Chip
                key={example.if}
                label={fill(copy.ifThenTemplate, example)}
                selected={false}
                onPress={() => {
                  setIfPart(example.if);
                  setThenPart(example.then);
                }}
              />
            ))}
          </Row>
          <Button
            label={copy.cards.if_then.button}
            onPress={() => run(() => saveIfThen(card.fixId === 'if_then' && stage === 'card' ? 'used' : null))}
            disabled={busy || !ifThenReady}
          />
        </View>
      ) : (
        <View style={styles.card}>
          {card.workedBefore ? <Text style={styles.badge}>{copy.workedBefore}</Text> : null}
          <Text style={styles.cardTitle}>{words.title}</Text>
          <Body>{words.body}</Body>
          {bestTime ? <Body>{fill(copy.bestTime, { when: copy.dayParts[bestTime] })}</Body> : null}
          <Button label={words.button} onPress={applyFix} disabled={busy} />
        </View>
      )}

      {problem ? <Notice>{problem}</Notice> : null}
      {/* "Something else" has no ladder, only the builder (RULES.md §3), so there's nothing else to try. */}
      {task.reason !== 'other' ? (
        <Button label={copy.tryElse} kind="secondary" onPress={tryElse} disabled={busy} />
      ) : null}
      {!showBuilder ? <Button label={copy.ownPlan} kind="secondary" onPress={ownPlan} disabled={busy} /> : null}
      <Button label={copy.notNow} kind="quiet" onPress={notNow} disabled={busy} />
    </Screen>
  );
}

function tidy(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

const styles = StyleSheet.create({
  spinner: { marginTop: 40 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, gap: 10 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  badge: { fontSize: 15, fontWeight: '600', color: colors.success },
  label: { fontSize: 17, fontWeight: '600', color: colors.text },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    color: colors.text,
    backgroundColor: colors.background,
  },
});
