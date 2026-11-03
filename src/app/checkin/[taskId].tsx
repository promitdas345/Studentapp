// S9 Check-in: "Did you get to it?" with Done / Partly / Not yet (PRODUCT.md S9, RULES.md §2).
// Not yet asks what got in the way, then opens the Fix screen. Saving an answer also settles
// whether the fix behind this task worked (RULES.md §4.2). notYet=1 (Start's "Not today") opens
// straight on the reasons.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Notice, Screen, Title, colors } from '../../components/ui';
import { en, fill } from '../../copy/en';
import { loadProblem, saveProblem } from '../../data/errors';
import { fetchFixEvent, setFixOutcome } from '../../data/fixEvents';
import { fetchTask, updateTask } from '../../data/tasks';
import type { MissReason, Profile, Task } from '../../data/types';
import { devWarn } from '../../lib/devLog';
import { goBack } from '../../lib/nav';
import { syncNotifications } from '../../lib/notifications';
import { useSession } from '../../lib/session';
import { formatTime, localTimeOf } from '../../lib/time';
import { prefixedTitle } from '../../rules/fixes';
import { ANSWERED_STATUSES } from '../../rules/insights';
import { outcomeUpdates, type CheckInAnswer } from '../../rules/outcomes';
import { encodePrefill } from '../../rules/plan';
import { isCrisisText } from '../../rules/safety';

const copy = en.checkin;

const REASONS: MissReason[] = ['too_big', 'forgot', 'distracted', 'tired', 'out_of_time', 'other'];
const NOTE_MAX = 200;

type Step = 'ask' | 'reasons' | 'done' | 'partly';

export default function CheckIn() {
  const { profile } = useSession();
  const params = useLocalSearchParams<{ taskId: string; notYet?: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [step, setStep] = useState<Step>(params.notYet === '1' ? 'reasons' : 'ask');
  const [doneLine, setDoneLine] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    fetchTask(params.taskId).then(
      (found) => {
        if (!active) return;
        // Deleted, or already answered (say, from another notification): Today shows where things are.
        if (!found || (ANSWERED_STATUSES as readonly string[]).includes(found.status)) router.replace('/');
        else setTask(found);
      },
      (error) => {
        if (active) setProblem(loadProblem(error));
      },
    );
    return () => {
      active = false;
    };
  }, [params.taskId, attempt]);

  if (!profile) return null;

  if (!task) {
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

  // Saves the answer; on a problem, shows the message and returns null so the student can retry.
  const save = async (answer: CheckInAnswer, reason: MissReason | null, reasonNote: string | null) => {
    setBusy(true);
    setProblem(null);
    try {
      return await saveAnswer(task, profile, answer, reason, reasonNote);
    } catch (error) {
      setProblem(saveProblem(error));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const done = async () => {
    const result = await save('done', null, null);
    if (result === null) return;
    setDoneLine(result.fixWorked ? copy.fixWorked : copy.doneLines[Math.floor(Math.random() * copy.doneLines.length)]);
    setStep('done');
  };

  const partly = async () => {
    if ((await save('partly', null, null)) !== null) setStep('partly');
  };

  const pickReason = async (reason: MissReason) => {
    if (reason === 'other') {
      setNoteOpen(true);
      return;
    }
    if ((await save('not_yet', reason, null)) !== null) openFix();
  };

  const saveOther = async () => {
    // The crisis check runs on the note before anything is saved (RULES.md §6.1). On a match
    // nothing is saved or logged, the note is emptied, and Support opens.
    if (isCrisisText(note)) {
      setNote('');
      router.push({ pathname: '/support', params: { crisis: '1' } });
      return;
    }
    const cleanNote = note.trim().replace(/\s+/g, ' ');
    if ((await save('not_yet', 'other', cleanNote.length > 0 ? cleanNote : null)) !== null) openFix();
  };

  const openFix = () => router.replace({ pathname: '/fix/[taskId]', params: { taskId: task.id } });

  // "Plan the rest" opens Plan with "Rest of: {title}" (PRODUCT.md S9). Plan picks the day and time.
  const planRest = () =>
    router.replace({
      pathname: '/plan',
      params: {
        prefill: encodePrefill({
          title: prefixedTitle(en.titlePrefixes.restOf, task.title),
          time: null,
          length: task.duration_min,
          tip: task.tip,
          cue: null,
          ifThen: null,
          fromFixEvent: null,
          pickTime: false,
          routineTime: false,
        }),
      },
    });

  const taskCard = (
    <View style={styles.card}>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <Text style={styles.meta}>
        {fill(en.today.taskMeta, {
          time: formatTime(localTimeOf(task.start_at, profile.timezone)),
          length: task.duration_min,
        })}
      </Text>
    </View>
  );

  if (step === 'done') {
    return (
      <Screen>
        <Title>{doneLine}</Title>
        <Button label={en.common.back} onPress={goBack} />
      </Screen>
    );
  }

  if (step === 'partly') {
    return (
      <Screen>
        <Title>{copy.partlyLine}</Title>
        <Button label={copy.planRest} onPress={planRest} />
        <Button label={copy.doneForNow} kind="secondary" onPress={goBack} />
      </Screen>
    );
  }

  if (step === 'reasons') {
    return (
      <Screen>
        <Title>{copy.notYetLine}</Title>
        {taskCard}
        {REASONS.map((reason) => (
          <Button
            key={reason}
            label={copy.reasons[reason]}
            kind="secondary"
            disabled={busy}
            onPress={() => pickReason(reason)}
          />
        ))}
        {noteOpen ? (
          <>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={copy.notePlaceholder}
              placeholderTextColor={colors.muted}
              maxLength={NOTE_MAX}
              multiline
              autoFocus
              accessibilityLabel={copy.notePlaceholder}
              style={styles.input}
            />
            <Button label={copy.next} onPress={saveOther} disabled={busy} />
          </>
        ) : null}
        {problem ? <Notice>{problem}</Notice> : null}
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>{copy.question}</Title>
      {taskCard}
      {problem ? <Notice>{problem}</Notice> : null}
      <Button label={copy.done} onPress={done} disabled={busy} />
      <Button label={copy.partly} kind="secondary" onPress={partly} disabled={busy} />
      <Button label={copy.notYet} kind="secondary" onPress={() => setStep('reasons')} disabled={busy} />
    </Screen>
  );
}

// Saves the answer, then settles the fix behind this task, if any (RULES.md §4.2). A problem with
// the fix's outcome is only logged: it must never undo or block the check-in itself.
async function saveAnswer(
  task: Task,
  profile: Profile,
  answer: CheckInAnswer,
  reason: MissReason | null,
  reasonNote: string | null,
): Promise<{ fixWorked: boolean }> {
  const now = new Date();
  await updateTask(task.id, {
    status: answer,
    reason,
    reason_note: reasonNote,
    checked_in_at: now.toISOString(),
  });
  let fixWorked = false;
  if (task.from_fix_event) {
    try {
      const event = await fetchFixEvent(task.from_fix_event);
      const updates = outcomeUpdates({ task, answer, now, fixEvents: event ? [event] : [] });
      for (const update of updates) await setFixOutcome(update.fixEventId, update.outcome, update.outcome_task_id);
      fixWorked = updates.some((update) => update.outcome === 'worked');
    } catch (error) {
      devWarn('check-in: fix outcome', error);
    }
  }
  syncNotifications(profile);
  return { fixWorked };
}

const styles = StyleSheet.create({
  spinner: { marginTop: 40 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, gap: 6 },
  taskTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  meta: { fontSize: 16, color: colors.muted },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    color: colors.text,
    textAlignVertical: 'top',
  },
});
