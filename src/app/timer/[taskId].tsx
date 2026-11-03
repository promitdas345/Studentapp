// S8 Focus timer: a countdown for the planned length from the moment Start was tapped
// (PRODUCT.md S8). It's worked out from timestamps, so it survives the app being closed, and
// syncNotifications schedules the "Time's up" notification. No blocking, no locking the phone.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button, Notice, Screen, colors } from '../../components/ui';
import { en, fill } from '../../copy/en';
import { loadProblem } from '../../data/errors';
import { fetchTask } from '../../data/tasks';
import type { Task } from '../../data/types';
import { track } from '../../lib/events';
import { goBack } from '../../lib/nav';
import { formatLeft, timerLeftMs } from '../../rules/start';

const copy = en.timer;

export default function Timer() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let active = true;
    fetchTask(taskId).then(
      (found) => {
        if (!active) return;
        if (found?.status === 'started') {
          setTask(found);
          track('timer_started');
        } else if (found?.status === 'planned') {
          router.replace({ pathname: '/start/[taskId]', params: { taskId: found.id } });
        } else {
          // Deleted, or already answered.
          router.replace('/');
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

  // Re-read the clock every second. The time left comes from the timestamps, never from counting ticks.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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

  const left = timerLeftMs(task.started_at ?? task.start_at, task.duration_min, now);
  // Both buttons open the check-in (PRODUCT.md S8), which asks how it went.
  const checkIn = () => router.replace({ pathname: '/checkin/[taskId]', params: { taskId: task.id } });

  return (
    <Screen scroll={false}>
      <View style={styles.middle}>
        <Text style={styles.time} accessibilityRole="timer">
          {left === 0 ? copy.timeUp : fill(copy.left, { time: formatLeft(left) })}
        </Text>
        <Text style={styles.taskTitle}>{task.title}</Text>
      </View>
      <Button label={copy.done} onPress={checkIn} />
      <Button label={copy.stop} kind="secondary" onPress={checkIn} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  spinner: { marginTop: 40 },
  middle: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  time: { fontSize: 48, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  taskTitle: { fontSize: 20, color: colors.muted, textAlign: 'center' },
});
