// Shown when the app can't reach the database at launch (usually no internet).
import { StyleSheet, View } from 'react-native';

import { Body, Button, Screen } from '../components/ui';
import { en } from '../copy/en';
import { useSession } from '../lib/session';

export default function Offline() {
  const { retry, loadFailKind } = useSession();
  return (
    <Screen scroll={false}>
      <View style={styles.middle}>
        <Body>{loadFailKind === 'server' ? en.errors.server : en.today.loadFailed}</Body>
      </View>
      <Button label={en.common.retry} onPress={retry} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  middle: { flex: 1, justifyContent: 'center' },
});
