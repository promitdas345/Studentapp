// S5 Today (home): Welcome back after a gap (S14), late check-ins ("How did these go?"), today's
// tasks, the plan buttons and this week's days vs goal (PRODUCT.md S5).
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';

import { WeekDots } from '../../components/WeekDots';
import { Body, Button, Heading, Notice, Screen, Title, colors } from '../../components/ui';
import { en, fill } from '../../copy/en';
import { saveProblem, toDataError, type DataErrorKind } from '../../data/errors';
import { updateMyProfile } from '../../data/profile';
import { fetchCheckInsSince, fetchLastCheckIn, fetchTasksOnDates, markUnansweredBefore } from '../../data/tasks';
import type { Task } from '../../data/types';
import { devWarn } from '../../lib/devLog';
import { track } from '../../lib/events';
import { markShownToday, shownToday } from '../../lib/flags';
import { askForReminders, remindersAllowed, syncNotifications } from '../../lib/notifications';
import { useSession } from '../../lib/session';
import { addDays, formatTime, localDate, localTimeOf, toInstant, weekStart } from '../../lib/time';
import { activeDaysThisWeek, effectiveWeeklyGoal, lighterGoal, welcomeBackDue } from '../../rules/insights';
import { dailyCap, showPlanTomorrowButton, slotsLeft } from '../../rules/plan';
import { cardAction } from '../../rules/start';

const copy = en.today;

// Unanswered tasks from the last 3 days can still be checked in; older ones become `unanswered`
// (PRODUCT.md S5).
const LATE_DAYS = 3;

type Loaded = {
  late: Task[];
  today: Task[];
  tomorrow: Task[];
  activeDays: number;
  remindersOn: boolean;
  // S14: after 3+ days without a check-in, while today has no plan yet.
  welcomeBack: boolean;
};

export default function Today() {
  const { profile, setProfile, flash, clearFlash } = useSession();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // null = loaded fine; otherwise why the last load failed.
  const [failed, setFailed] = useState<DataErrorKind | null>(null);
  const [goalProblem, setGoalProblem] = useState<string | null>(null);

  // Loads Today's data; returns a function that ignores the answer if the screen has moved on.
  const load = useCallback(() => {
    if (!profile) return () => undefined;
    let active = true;
    const now = new Date();
    const tz = profile.timezone;
    const today = localDate(now, tz);
    const tomorrow = addDays(today, 1);
    const firstLateDay = addDays(today, -LATE_DAYS);
    markUnansweredBefore(firstLateDay).catch((error) => devWarn('today: unanswered', error));
    const lateDays = Array.from({ length: LATE_DAYS }, (_, i) => addDays(firstLateDay, i));
    Promise.all([
      fetchTasksOnDates([...lateDays, today, tomorrow]),
      fetchCheckInsSince(toInstant(weekStart(now, tz), '00:00', tz).toISOString()),
      remindersAllowed(),
      fetchLastCheckIn(),
    ]).then(
      ([tasks, checkIns, remindersOn, lastCheckIn]) => {
        if (!active) return;
        setFailed(null);
        // Someone who never checked in counts from when they signed up.
        const welcomeBack =
          welcomeBackDue(lastCheckIn ?? profile.created_at, now, tz) && !tasks.some((t) => t.plan_date === today);
        if (welcomeBack && !shownToday('welcome_back', today)) {
          markShownToday('welcome_back', today);
          track('welcome_back_shown');
        }
        setLoaded({
          welcomeBack,
          late: tasks.filter(
            (t) => t.plan_date < today && (t.status === 'planned' || t.status === 'started'),
          ),
          today: tasks.filter((t) => t.plan_date === today),
          tomorrow: tasks.filter((t) => t.plan_date === tomorrow),
          activeDays: activeDaysThisWeek(checkIns, now, tz),
          remindersOn,
        });
      },
      (error) => {
        if (active) setFailed(toDataError(error).kind);
      },
    );
    return () => {
      active = false;
    };
  }, [profile]);

  // Reload every time Today comes back into view (after planning, editing or deleting), and when
  // the app returns to the foreground: the date may have changed, or reminders were turned on in Settings.
  useFocusEffect(
    useCallback(() => {
      let cancel = load();
      const subscription = AppState.addEventListener('change', (state) => {
        if (state !== 'active') return;
        cancel();
        clearFlash();
        cancel = load();
      });
      return () => {
        subscription.remove();
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

  // "Make this week's goal lighter" (S14): one day less, for this week only (src/rules/insights.ts).
  const lighterThisWeek = profile.light_goal !== null && profile.light_goal_week === weekStart(now, tz);
  const makeGoalLighter = async () => {
    setGoalProblem(null);
    try {
      setProfile(
        await updateMyProfile(profile.user_id, { light_goal: lighterGoal(goal), light_goal_week: weekStart(now, tz) }),
      );
    } catch (error) {
      setGoalProblem(saveProblem(error));
    }
  };

  const turnOnReminders = async () => {
    const on = await askForReminders().catch(() => false);
    if (on) syncNotifications(profile);
    setLoaded((current) => (current ? { ...current, remindersOn: on } : current));
  };

  let body;
  if (failed) {
    body = (
      <Notice action={<Button label={en.common.retry} kind="secondary" onPress={() => load()} />}>
        {failed === 'server' ? en.errors.server : copy.loadFailed}
      </Notice>
    );
  } else if (!loaded) {
    body = <ActivityIndicator size="large" style={styles.spinner} />;
  } else {
    const todayFull = slotsLeft(loaded.today.length, dailyCap(profile.plan_hint, todayDate)) === 0;
    const planTomorrow = showPlanTomorrowButton(now, tz, loaded.today.map((t) => t.status));
    body = (
      <>
        {loaded.welcomeBack ? (
          <Notice
            action={
              <>
                <Button
                  label={en.welcomeBack.planToday}
                  onPress={() => router.push({ pathname: '/plan', params: { day: 'today' } })}
                />
                {!lighterThisWeek ? (
                  <Button label={en.welcomeBack.lighterGoal} kind="secondary" onPress={makeGoalLighter} />
                ) : null}
              </>
            }>
            {en.welcomeBack.text}
          </Notice>
        ) : null}
        {goalProblem ? <Notice>{goalProblem}</Notice> : null}

        {!loaded.remindersOn ? (
          <Notice action={<Button label={en.reminders.offBannerButton} kind="secondary" onPress={turnOnReminders} />}>
            {en.reminders.offBanner}
          </Notice>
        ) : null}

        {loaded.late.length > 0 ? (
          <>
            <Heading>{copy.howDidTheseGo}</Heading>
            {loaded.late.map((task) => (
              <TaskCard key={task.id} task={task} tz={tz} now={now} late />
            ))}
          </>
        ) : null}

        {loaded.today.length === 0 ? (
          <Body>{copy.empty}</Body>
        ) : (
          loaded.today.map((task) => <TaskCard key={task.id} task={task} tz={tz} now={now} />)
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
              <TaskCard key={task.id} task={task} tz={tz} now={now} />
            ))}
          </>
        ) : null}

        <WeekLine activeDays={loaded.activeDays} goal={goal} />
      </>
    );
  }

  return (
    <Screen tab>
      <Title>{copy.title}</Title>
      {flash ? <Notice>{flash}</Notice> : null}
      {body}
    </Screen>
  );
}

// Tapping the card opens Start, the timer or the check-in, depending on where the task is
// (PRODUCT.md S7). A late one (from an earlier day) always opens its check-in. Only a task that
// hasn't started yet, today or tomorrow, can be edited.
function TaskCard({ task, tz, now, late = false }: { task: Task; tz: string; now: Date; late?: boolean }) {
  const action = late ? 'checkin' : cardAction(task, now);
  const open = () => {
    const params = { taskId: task.id };
    if (action === 'start') router.push({ pathname: '/start/[taskId]', params });
    if (action === 'timer') router.push({ pathname: '/timer/[taskId]', params });
    if (action === 'checkin') router.push({ pathname: '/checkin/[taskId]', params });
  };
  return (
    <Pressable
      onPress={open}
      disabled={action === 'none'}
      accessibilityRole={action === 'none' ? undefined : 'button'}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{task.title}</Text>
        <Text style={styles.cardMeta}>
          {fill(copy.taskMeta, { time: formatTime(localTimeOf(task.start_at, tz)), length: task.duration_min })}
        </Text>
        <Text style={styles.cardStatus}>{copy.status[task.status]}</Text>
      </View>
      {task.status === 'planned' && !late ? (
        <Button
          label={copy.edit}
          kind="quiet"
          onPress={() => router.push({ pathname: '/plan', params: { taskId: task.id } })}
        />
      ) : null}
    </Pressable>
  );
}

// "This week: 2 of 4 days" with dots (PRODUCT.md S5: dots, not a streak).
function WeekLine({ activeDays, goal }: { activeDays: number; goal: number }) {
  return (
    <View style={styles.week}>
      <Text style={styles.weekText}>{fill(copy.weekLine, { n: Math.min(activeDays, goal), goal })}</Text>
      <WeekDots activeDays={activeDays} goal={goal} />
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
  pressed: { opacity: 0.7 },
  week: { marginTop: 12, gap: 8 },
  weekText: { fontSize: 17, color: colors.text },
});
