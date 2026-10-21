// S3 Setup: what's hardest, weekly goal, plan reminder (PRODUCT.md S3, RULES.md §5.1).
// Everything here can be changed later in Settings.
import { router } from 'expo-router';
import { useState } from 'react';

import { TimeField } from '../../components/TimeField';
import { Body, Button, Chip, Gap, Heading, Notice, Row, Screen } from '../../components/ui';
import { en } from '../../copy/en';
import { updateMyProfile } from '../../data/profile';
import type { HardThing } from '../../data/types';
import { outsideQuietHours } from '../../lib/quietHours';
import { useSession } from '../../lib/session';

const copy = en.setup;
const HARD_THINGS: HardThing[] = ['starting', 'time', 'forgetting', 'distraction'];
const GOALS = [3, 4, 5, 7];
const DEFAULT_TIME = { evening: '20:30', morning: '08:00' } as const;
type Mode = keyof typeof DEFAULT_TIME;

export default function Setup() {
  const { profile, setProfile } = useSession();
  const [hard, setHard] = useState<HardThing[]>(profile?.hard_things ?? []);
  const [goal, setGoal] = useState(profile?.weekly_goal ?? 4);
  const [mode, setMode] = useState<Mode>(
    profile && profile.plan_time < '12:00' ? 'morning' : 'evening',
  );
  const [time, setTime] = useState(profile?.plan_time ?? DEFAULT_TIME.evening);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!profile) return null;

  const toggle = (thing: HardThing) =>
    setHard((current) =>
      current.includes(thing) ? current.filter((t) => t !== thing) : [...current, thing],
    );

  const chooseMode = (next: Mode) => {
    setMode(next);
    setTime(DEFAULT_TIME[next]);
  };

  const save = async () => {
    setSaving(true);
    setFailed(false);
    try {
      const updated = await updateMyProfile(profile.user_id, {
        hard_things: hard,
        weekly_goal: goal,
        plan_time: time,
        // "Forgetting what I planned" turns on the heads-up and follow-up (RULES.md §5.1).
        extra_reminders: hard.includes('forgetting') ? true : profile.extra_reminders,
      });
      setProfile(updated);
      router.push('/onboarding/reminders');
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Heading>{copy.hardestTitle}</Heading>
      <Row wrap>
        {HARD_THINGS.map((thing) => (
          <Chip
            key={thing}
            label={copy.hardest[thing]}
            selected={hard.includes(thing)}
            onPress={() => toggle(thing)}
          />
        ))}
      </Row>

      <Gap size={8} />
      <Heading>{copy.goalTitle}</Heading>
      <Row>
        {GOALS.map((n) => (
          <Chip key={n} label={String(n)} selected={goal === n} onPress={() => setGoal(n)} />
        ))}
      </Row>
      <Body muted>{copy.goalHint}</Body>

      <Gap size={8} />
      <Heading>{copy.reminderTitle}</Heading>
      <Body muted>{copy.reminderHint}</Body>
      <Row>
        <Chip label={copy.evening} selected={mode === 'evening'} onPress={() => chooseMode('evening')} />
        <Chip label={copy.morning} selected={mode === 'morning'} onPress={() => chooseMode('morning')} />
      </Row>
      <TimeField
        value={time}
        accessibilityLabel={copy.changeTime}
        onChange={(picked) => setTime(outsideQuietHours(picked, profile.quiet_start, profile.quiet_end))}
      />

      <Gap />
      {failed ? <Notice>{en.errors.saveFailed}</Notice> : null}
      <Button label={copy.next} onPress={save} disabled={saving} />
    </Screen>
  );
}
