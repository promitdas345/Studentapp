// S5 Today (home): today's tasks, the plan buttons, this week's days vs goal (PRODUCT.md S5).
// "How did these go?", Start and Welcome back arrive in later milestones.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Heading, Notice, Screen, Title, colors } from '../components/ui';
import { en, fill } from '../copy/en';
import { fetchCheckInsSince, fetchTasksOnDates } from '../data/tasks';
import type { Task } from '../data/types';
import { askForReminders, remindersAllowed } from '../lib/notifications';
import { useSession } from '../lib/session';
import { addDays, formatTime, localDate, localTimeOf, toInstant, weekStart } from '../lib/time';
import { activeDaysThisWeek, effectiveWeeklyGoal } from '../rules/insights';
import { dailyCap, showPlanTomorrowButton, slotsLeft } from '../rules/plan';

const copy = en.today;

type Loaded = { today: Task[]; tomorrow: Task[]; activeDays: number; remindersOn: boolean };

export default function Today() {
  const { profile, flash, clearFlash } = useSession();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  // Loads Today's data; returns a function that ignores the answer if the screen has moved on.
  const load = useCallback(() => {
    if (!profile) return () => undefined;
    let active = true;
    const now = new Date();
    const tz = profile.timezone;
    const today = localDate(now, tz);
    const tomorrow = addDays(today, 1);
    Promise.all([
      fetchTasksOnDates([today, tomorrow]),
      fetchCheckInsSince(toInstant(weekStart(now, tz), '00:00', tz).toISOString()),
      remindersAllowed(),
    ]).then(
      ([tasks, checkIns, remindersOn]) => {
        if (!active) return;
        setFailed(false);
        setLoaded({
          today: tasks.filter((t) => t.plan_date === today),
          tomorrow: tasks.filter((t) => t.plan_date === tomorrow),
          activeDays: activeDaysThisWeek(checkIns, now, tz),
          remindersOn,
        });
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [profile]);

  // Reload every time Today comes back into view (after planning, editing or deleting).
  useFocusEffect(
    useCallback(() => {
      const cancel = load();
      return () => {
        cancel();
        clearFlash();
      };
    }, [load, clearFlash]),
  );

  if (!profile) return null;

  const now = new Date();
  const tz = profile.timezone;
  const todayDate = localDate(now, tz);
  const goal = effectiveWeeklyGoal(profile, now, tz);

  const turnOnReminders = async () => {
    const on = await askForReminders().catch(() => false);
    setLoaded((current) => (current ? { ...current, remindersOn: on } : current));
  };

  let body;
  if (failed) {
    body = (
      <Notice action={<Button label={en.common.retry} kind="secondary" onPress={() => load()} />}>
        {copy.loadFailed}
      </Notice>
    );
  } else if (!loaded) {
    body = <ActivityIndicator size="large" style={styles.spinner} />;
  } else {
    const todayFull = slotsLeft(loaded.today.length, dailyCap(profile.plan_hint, todayDate)) === 0;
    const planTomorrow = showPlanTomorrowButton(now, tz, loaded.today.map((t) => t.status));
    body = (
      <>
        {!loaded.remindersOn ? (
          <Notice action={<Button label={en.reminders.offBannerButton} kind="secondary" onPress={turnOnReminders} />}>
            {en.reminders.offBanner}
          </Notice>
        ) : null}

        {loaded.today.length === 0 ? (
          <Body>{copy.empty}</Body>
        ) : (
          loaded.today.map((task) => <TaskCard key={task.id} task={task} tz={tz} />)
        )}

        {!todayFull && !planTomorrow ? (
          <Button
            label={copy.planToday}
            kind={loaded.today.length === 0 ? 'primary' : 'secondary'}
            onPress={() => router.push({ pathname: '/plan', params: { day: 'today' } })}
          />
        ) : null}
        {planTomorrow ? (
          <Button
            label={copy.planTomorrow}
            onPress={() => router.push({ pathname: '/plan', params: { day: 'tomorrow' } })}
          />
        ) : null}

        {loaded.tomorrow.length > 0 ? (
          <>
            <Heading>{copy.tomorrowSection}</Heading>
            {loaded.tomorrow.map((task) => (
              <TaskCard key={task.id} task={task} tz={tz} />
            ))}
          </>
        ) : null}

        <WeekLine activeDays={loaded.activeDays} goal={goal} />
      </>
    );
  }

  return (
    <Screen>
      <Title>{copy.title}</Title>
      {flash ? <Notice>{flash}</Notice> : null}
      {body}
    </Screen>
  );
}

function TaskCard({ task, tz }: { task: Task; tz: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{task.title}</Text>
        <Text style={styles.cardMeta}>
          {fill(copy.taskMeta, { time: formatTime(localTimeOf(task.start_at, tz)), length: task.duration_min })}
        </Text>
        <Text style={styles.cardStatus}>{copy.status[task.status]}</Text>
      </View>
      <Button
        label={copy.edit}
        kind="quiet"
        onPress={() => router.push({ pathname: '/plan', params: { taskId: task.id } })}
      />
    </View>
  );
}

// Days checked in vs the weekly goal, as dots (PRODUCT.md S5: dots, not a streak).
function WeekLine({ activeDays, goal }: { activeDays: number; goal: number }) {
  const dots = Array.from({ length: goal }, (_, i) => i < activeDays);
  return (
    <View style={styles.week}>
      <Text style={styles.weekText}>{fill(copy.weekLine, { n: Math.min(activeDays, goal), goal })}</Text>
      <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {dots.map((filled, i) => (
          <View key={i} style={[styles.dot, filled && styles.dotFilled]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  spinner: { marginTop: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  cardMeta: { fontSize: 16, color: colors.muted },
  cardStatus: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  week: { marginTop: 12, gap: 8 },
  weekText: { fontSize: 17, color: colors.text },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.dot },
  dotFilled: { backgroundColor: colors.success },
});
