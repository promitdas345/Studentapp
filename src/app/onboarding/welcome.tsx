// S1 Welcome: leads with the feeling, says what the app does, one button (PRODUCT.md S1).
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Body, Button, Screen, Title } from '../../components/ui';
import { en } from '../../copy/en';

const copy = en.welcome;

export default function Welcome() {
  return (
    <Screen scroll={false}>
      <View style={styles.middle}>
        <Title>{copy.title}</Title>
        <Body>{copy.body}</Body>
      </View>
      <Body muted>{copy.smallPrint}</Body>
      <Button label={copy.button} onPress={() => router.push('/onboarding/collect')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  middle: { flex: 1, justifyContent: 'center', gap: 16 },
});
