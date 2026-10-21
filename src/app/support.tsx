// S13 Need to talk to someone? Reachable from Settings at all times, and opened by the crisis check
// with ?crisis=1 (RULES.md §6). Calm, short, tap to call or text. Never logged anywhere.
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';

import { Body, Button, Heading, Screen, Title, colors } from '../components/ui';
import { en } from '../copy/en';

const copy = en.support;

type Contact = {
  title: string;
  body: string;
  actions: { label: string; url: string }[];
};

const CONTACTS: Contact[] = [
  { title: copy.dangerTitle, body: copy.dangerBody, actions: [{ label: copy.call911, url: 'tel:911' }] },
  {
    title: copy.suicideTitle,
    body: copy.suicideBody,
    actions: [
      { label: copy.call988, url: 'tel:988' },
      { label: copy.text988, url: 'sms:988' },
    ],
  },
  { title: copy.nlTitle, body: copy.nlBody, actions: [{ label: copy.call811, url: 'tel:811' }] },
  {
    title: copy.campusTitle,
    body: copy.campusBody,
    actions: [{ label: copy.callCampus, url: 'tel:+17098644100' }],
  },
  {
    title: copy.swccTitle,
    body: copy.swccBody,
    actions: [
      { label: copy.callSwcc, url: 'tel:+17098648500' },
      { label: copy.emailSwcc, url: 'mailto:samedaycounselling@mun.ca' },
    ],
  },
];

export default function Support() {
  const { crisis } = useLocalSearchParams<{ crisis?: string }>();

  return (
    <Screen>
      {crisis === '1' ? <Body>{copy.crisisOpening}</Body> : null}
      <Title>{copy.title}</Title>
      {CONTACTS.map((contact) => (
        <View key={contact.title} style={styles.card}>
          <Heading>{contact.title}</Heading>
          <Body>{contact.body}</Body>
          {contact.actions.map((action) => (
            <Button
              key={action.url}
              label={action.label}
              kind="secondary"
              onPress={() => {
                Linking.openURL(action.url).catch(() => undefined);
              }}
            />
          ))}
        </View>
      ))}
      <Body muted>{copy.footer}</Body>
      <Button label={copy.back} kind="quiet" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, gap: 10 },
});
