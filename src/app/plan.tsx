// S6 Plan: add up to 3 tasks for today or tomorrow, or edit/delete one (PRODUCT.md S6).
// Must take under 30 seconds: the title is the only thing that has to be typed.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { TimeField } from '../components/TimeField';
import { Body, Button, Chip, Gap, Notice, Row, Screen, Title, colors } from '../components/ui';
import { en, fill } from '../copy/en';
import { toDataError } from '../data/errors';
import { deleteTask, fetchTasksOnDates, insertTasks, updateTask } from '../data/tasks';
import type { Task } from '../data/types';
import { lastStartTime, rememberStartTime } from '../lib/flags';
import { useSession } from '../lib/session';
import { addDays, formatTime, localDate, localTimeOf, toInstant } from '../lib/time';
import {
  DEFAULT_LENGTH,
  PLAN_LENGTHS,
  TITLE_MAX,
  dailyCap,
  defaultPlanDay,
  defaultStartTime,
  shouldShowTitleTip,
  slotsLeft,
  validateTitle,
  type PlanDay,
} from '../rules/plan';
import { isCrisisText } from '../rules/safety';

const copy = en.plan;

type Entry = { key: number; title: string; time: string; length: number };

export default function Plan() {
  const { profile, showFlash } = useSession();
  const params = useLocalSearchParams<{ day?: string; taskId?: string }>();
  const editingId = typeof params.taskId === 'string' ? params.taskId : null;

  const tz = profile?.timezone ?? 'America/St_Johns';
  const now = useMemo(() => new Date(), []);
  const todayDate = localDate(now, tz);
  const dateFor = (day: PlanDay) => (day === 'today' ? todayDate : addDays(todayDate, 1));

  const [day, setDay] = useState<PlanDay>(
    params.day === 'today' || params.day === 'tomorrow' ? params.day : defaultPlanDay(now, tz),
  );
  const [entries, setEntries] = useState<Entry[]>([]);
  const [existing, setExisting] = useState<Task[] | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const newEntry = (key: number, forDay: PlanDay): Entry => ({
    key,
    title: '',
    time: defaultStartTime({ day: forDay, now, tz, lastUsed: lastStartTime() }),
    length: DEFAULT_LENGTH,
  });

  // Load today's and tomorrow's tasks: to count against the daily cap, and to find the one being edited.
  useEffect(() => {
    let active = true;
    fetchTasksOnDates([todayDate, addDays(todayDate, 1)]).then(
      (tasks) => {
        if (!active) return;
        setExisting(tasks);
        const task = editingId ? tasks.find((t) => t.id === editingId) ?? null : null;
        if (task) {
          setEditing(task);
          setDay(task.plan_date === todayDate ? 'today' : 'tomorrow');
          setEntries([{ key: 0, title: task.title, time: localTimeOf(task.start_at, tz), length: task.duration_min }]);
        } else {
          setEntries([newEntry(0, day)]);
        }
      },
      () => {
        if (active) setProblem(en.today.loadFailed);
      },
    );
    return () => {
      active = false;
    };
    // Runs once when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profile) return null;

  const date = dateFor(day);
  const cap = dailyCap(profile.plan_hint, date);
  const others = (existing ?? []).filter((t) => t.plan_date === date && t.id !== editingId).length;
  const maxEntries = editing ? 1 : slotsLeft(others, cap);
  const atCap = others + entries.length >= cap;
  const capMessage = cap < 3 ? copy.twoToday : copy.threeIsPlenty;
  const placeholder = profile.hard_things.includes('starting')
    ? copy.whatPlaceholderStarting
    : copy.whatPlaceholder;
  const lengths: number[] = [...PLAN_LENGTHS];
  // A fix can set 5 or 90 minutes (RULES.md §3); keep that option visible when editing such a task.
  for (const entry of entries) if (!lengths.includes(entry.length)) lengths.push(entry.length);
  lengths.sort((a, b) => a - b);

  const update = (key: number, change: Partial<Entry>) =>
    setEntries((list) => list.map((e) => (e.key === key ? { ...e, ...change } : e)));

  const switchDay = (next: PlanDay) => {
    if (next === day) return;
    setDay(next);
    // New tasks get that day's default start time; titles stay.
    if (!editing) setEntries((list) => list.map((e) => ({ ...e, time: newEntry(e.key, next).time })));
  };

  const canSave =
    !saving &&
    entries.length > 0 &&
    entries.length <= maxEntries &&
    entries.every((e) => validateTitle(e.title).ok);

  const save = async () => {
    // The crisis check runs on every title before anything is saved (RULES.md §6.1).
    // On a match nothing is saved or logged, the field is emptied, and Support opens.
    const crisis = entries.find((e) => isCrisisText(e.title));
    if (crisis) {
      update(crisis.key, { title: '' });
      router.push({ pathname: '/support', params: { crisis: '1' } });
      return;
    }
    setSaving(true);
    setProblem(null);
    try {
      const rows = entries.map((e) => {
        const check = validateTitle(e.title);
        return {
          plan_date: date,
          title: check.ok ? check.title : e.title.trim(),
          start_at: toInstant(date, e.time, tz).toISOString(),
          duration_min: e.length,
        };
      });
      if (editing) {
        await updateTask(editing.id, rows[0]);
      } else {
        // "Getting distracted" makes new tasks carry the phone tip (RULES.md §5.1).
        const tip = profile.hard_things.includes('distraction') ? ('phone_away' as const) : undefined;
        await insertTasks(rows.map((row) => (tip ? { ...row, tip } : row)));
      }
      const earliest = [...entries].sort((a, b) => a.time.localeCompare(b.time))[0].time;
      rememberStartTime(entries[entries.length - 1].time);
      showFlash(fill(copy.saved, { time: formatTime(earliest) }));
      router.back();
    } catch (error) {
      setProblem(toDataError(error).kind === 'network' ? en.errors.saveFailed : en.errors.server);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!editing) return;
    Alert.alert(copy.deleteConfirmTitle, undefined, [
      { text: copy.deleteConfirmKeep, style: 'cancel' },
      {
        text: copy.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(editing.id);
            router.back();
          } catch (error) {
            setProblem(toDataError(error).kind === 'network' ? en.errors.saveFailed : en.errors.server);
          }
        },
      },
    ]);
  };

  if (!existing && !problem) {
    return (
      <Screen>
        <ActivityIndicator size="large" style={styles.spinner} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>{editing ? copy.titleEdit : day === 'today' ? copy.titleToday : copy.titleTomorrow}</Title>
      <Row>
        <Chip label={copy.dayToday} selected={day === 'today'} onPress={() => switchDay('today')} />
        <Chip label={copy.dayTomorrow} selected={day === 'tomorrow'} onPress={() => switchDay('tomorrow')} />
      </Row>

      {maxEntries === 0 ? <Notice>{capMessage}</Notice> : null}

      {entries.slice(0, Math.max(maxEntries, 0)).map((entry, index) => (
        <View key={entry.key} style={styles.entry}>
          <Text style={styles.label}>{copy.whatLabel}</Text>
          <TextInput
            value={entry.title}
            onChangeText={(title) => update(entry.key, { title })}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            maxLength={TITLE_MAX}
            autoFocus={index === entries.length - 1 && !editing}
            accessibilityLabel={copy.whatLabel}
            style={styles.input}
          />
          {entry.title.trim().length > 0 && shouldShowTitleTip(entry.title) ? (
            <Body muted>{copy.titleTip}</Body>
          ) : null}

          <Text style={styles.label}>{copy.whenLabel}</Text>
          <TimeField
            value={entry.time}
            accessibilityLabel={copy.whenLabel}
            onChange={(time) => update(entry.key, { time })}
          />

          <Text style={styles.label}>{copy.howLongLabel}</Text>
          <Row>
            {lengths.map((n) => (
              <Chip
                key={n}
                label={fill(copy.minutes, { n })}
                selected={entry.length === n}
                onPress={() => update(entry.key, { length: n })}
              />
            ))}
          </Row>
          {index > 0 ? (
            <Button
              label={copy.remove}
              kind="quiet"
              onPress={() => setEntries((list) => list.filter((e) => e.key !== entry.key))}
            />
          ) : null}
        </View>
      ))}

      {!editing && maxEntries > 0 && atCap ? <Body muted>{capMessage}</Body> : null}
      {!editing && entries.length < maxEntries ? (
        <Button
          label={copy.addAnother}
          kind="secondary"
          onPress={() =>
            setEntries((list) => [...list, newEntry(Math.max(...list.map((e) => e.key), 0) + 1, day)])
          }
        />
      ) : null}

      <Gap size={4} />
      {problem ? <Notice>{problem}</Notice> : null}
      {maxEntries > 0 ? <Button label={copy.save} onPress={save} disabled={!canSave} /> : null}
      {editing ? <Button label={copy.delete} kind="quiet" onPress={confirmDelete} /> : null}
      <Button label={en.common.back} kind="quiet" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  spinner: { marginTop: 40 },
  entry: { backgroundColor: colors.card, borderRadius: 14, padding: 16, gap: 10 },
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
