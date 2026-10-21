// Shown for a moment at launch while we check who's signed in. The splash screen covers it.
import { StyleSheet, View } from 'react-native';

import { colors } from '../components/ui';

export default function Loading() {
  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
