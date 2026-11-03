// S11 This week: days checked in vs the goal, tasks done, what got in the way most, what works for
// me, one gentle suggestion, and Share my week (PRODUCT.md S11). Monday to Sunday, local time.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Share, StyleSheet, Text, View } from 'react-native';

import { WeekDots } from '../../components/WeekDots';
import { Body, Button, Heading, Notice, Screen, Title, colors } from '../../components/ui';
import { en, fill } from '../../copy/en';
import { loadProblem } from '../../data/errors';
import { fetchWorkedFixEvents } from '../../data/fixEvents';
import { fetchCheckInsSince } from '../../data/tasks';
import { devWarn } from '../../lib/devLog';
import { track } from '../../lib/events';
import { useSession } from '../../lib/session';
import { toInstant, weekStart } from '../../lib/time';
import { firstFixFor, type FixId } from '../../rules/fixes';
import { effectiveWeeklyGoal, weekSummary, whatWorksForMe, type WeekSummary } from '../../rules/insights';

const copy = en.week;

type Loaded = { summary: WeekSummary; works: FixId[] };

export default function Week() {
  const { profile } = useSession();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!profile) return () => undefined;
    let active = true;
    const now = new Date();
    const tz = profile.timezone;
    Promise.all([
      fetchCheckInsSince(toInstant(weekStart(now, tz), '00:00', tz).toISOString()),
      fetchWorkedFixEvents(),
    ]).then(
      ([checkIns, worked]) => {
        if (!active) return;
        setProblem(null);
        setLoaded({ summary: weekSummary(checkIns, now, tz), works: whatWorksForMe(worked) });
      },
      (error) => {
        if (active) setProblem(loadProblem(error));
      },
    );
    return () => {
      active = false;
    };
  }, [profile]);

  // Fresh numbers every time the tab opens.
  useFocusEffect(
    useCallback(() => {
      track('week_viewed');
      return load();
    }, [load]),
  );

  if (!profile) return null;

  const goal = effectiveWeeklyGoal(profile, new Date(), profile.timezone);

  let body;
  if (problem) {
    body = <Notice action={<Button label={en.common.retry} kind="secondary" onPress={() => load()} />}>{problem}</Notice>;
  } else if (!loaded) {
    body = <ActivityIndicator size="large" style={styles.spinner} />;
  } else {
    const { activeDays, tasksDone, topReason } = loaded.summary;
    const days = Math.min(activeDays, goal);
    const share = async () => {
      // Numbers only: never a task title (PRODUCT.md S11).
      const message = fill(tasksDone === 1 ? copy.shareTextOne : copy.shareText, { n: days, goal, k: tasksDone });
      try {
        const result = await Share.share({ message });
        if (result.action === Share.sharedAction) track('summary_shared');
      } catch (error) {
        devWarn('week: share', error);
      }
    };
    body = (
      <>
        <View style={styles.days}>
          <Text style={styles.daysText}>{fill(copy.days, { n: days, goal })}</Text>
          <WeekDots activeDays={activeDays} goal={goal} />
        </View>
        <Body>{fill(copy.tasksDone, { k: tasksDone })}</Body>
        {topReason ? <Body>{fill(copy.topReason, { reason: en.checkin.reasons[topReason] })}</Body> : null}

        <Heading>{copy.worksTitle}</Heading>
        {loaded.works.length === 0 ? (
          <Body muted>{copy.worksEmpty}</Body>
        ) : (
          loaded.works.map((fixId) => <Body key={fixId}>{en.fix.cards[fixId].title}</Body>)
        )}

        {topReason ? (
          <Body>{fill(copy.tryThis, { fix: en.fix.cards[firstFixFor(topReason)].title })}</Body>
        ) : null}

        <Button label={copy.share} kind="secondary" onPress={share} />
      </>
    );
  }

  return (
    <Screen tab>
      <Title>{copy.title}</Title>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  spinner: { marginTop: 40 },
  days: { gap: 8 },
  daysText: { fontSize: 24, fontWeight: '600', color: colors.text },
});
