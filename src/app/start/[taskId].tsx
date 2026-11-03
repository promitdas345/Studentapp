// S7 Start: opened from a nudge, or by tapping a planned task on Today (PRODUCT.md S7).
// "Starting now?" with Start, In 10 min (once per task) and Not today.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Notice, Screen, Title, colors } from '../../components/ui';
import { en, fill } from '../../copy/en';
import { loadProblem, saveProblem } from '../../data/errors';
import { fetchTask, updateTask } from '../../data/tasks';
import type { Task } from '../../data/types';
import { track } from '../../lib/events';
import { goBack } from '../../lib/nav';
import { syncNotifications } from '../../lib/notifications';
import { nudgeLine } from '../../lib/schedule';
import { useSession } from '../../lib/session';
import { formatTime, localTimeOf } from '../../lib/time';
import { canSnooze, snoozedStart, startPrompt } from '../../rules/start';

const copy = en.start;

export default function Start() {
  const { profile, showFlash } = useSession();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    fetchTask(taskId).then(
      (found) => {
        if (!active) return;
        // Deleted since the nudge was scheduled, or already answered: Today shows where things are.
        if (!found || (found.status !== 'planned' && found.status !== 'started')) {
          router.replace('/');
        } else if (found.status === 'started') {
          router.replace({ pathname: '/timer/[taskId]', params: { taskId: found.id } });
        } else {
          setTask(found);
        }
      },
      (error) => {
        if (active) setProblem(loadProblem(error));
      },
    );
    return () => {
      active = false;
    };
  }, [taskId, attempt]);

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

  const tz = profile.timezone;
  const line = nudgeLine(task, profile.hard_things);

  const start = async () => {
    setBusy(true);
    setProblem(null);
    try {
      await updateTask(task.id, { status: 'started', started_at: new Date().toISOString() });
      track('start_tapped');
      syncNotifications(profile);
      router.replace({ pathname: '/timer/[taskId]', params: { taskId: task.id } });
    } catch (error) {
      setProblem(saveProblem(error));
    } finally {
      setBusy(false);
    }
  };

  const snooze = async () => {
    setBusy(true);
    setProblem(null);
    try {
      const next = snoozedStart(task.start_at, new Date());
      await updateTask(task.id, { start_at: next.toISOString(), snoozed: true });
      track('snooze_tapped');
      syncNotifications(profile);
      showFlash(fill(en.plan.saved, { time: formatTime(localTimeOf(next, tz)) }));
      goBack();
    } catch (error) {
      setProblem(saveProblem(error));
    } finally {
      setBusy(false);
    }
  };

  // "Not today" is a miss: it goes straight to "What got in the way?" (PRODUCT.md S7, RULES.md §2).
  const notToday = () =>
    router.replace({ pathname: '/checkin/[taskId]', params: { taskId: task.id, notYet: '1' } });

  return (
    <Screen>
      <Title>{startPrompt(task.start_at, new Date()) === 'start_now' ? copy.startNow : copy.startingNow}</Title>
      <View style={styles.card}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.meta}>
          {fill(en.today.taskMeta, { time: formatTime(localTimeOf(task.start_at, tz)), length: task.duration_min })}
        </Text>
        {line ? <Body>{line}</Body> : null}
      </View>
      {profile.hard_things.includes('time') ? <Body muted>{copy.timeUpHint}</Body> : null}
      {problem ? <Notice>{problem}</Notice> : null}
      <Button label={copy.start} onPress={start} disabled={busy} />
      {canSnooze(task) ? <Button label={copy.snooze} kind="secondary" onPress={snooze} disabled={busy} /> : null}
      <Button label={copy.notToday} kind="quiet" onPress={notToday} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  spinner: { marginTop: 40 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, gap: 6 },
  taskTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  meta: { fontSize: 16, color: colors.muted },
});
