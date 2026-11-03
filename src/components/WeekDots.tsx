// Days checked in vs the weekly goal, as dots: never a streak (PRODUCT.md S5, S11).
import { StyleSheet, View } from 'react-native';

import { colors } from './ui';

export function WeekDots({ activeDays, goal }: { activeDays: number; goal: number }) {
  const dots = Array.from({ length: goal }, (_, i) => i < activeDays);
  return (
    <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {dots.map((filled, i) => (
        <View key={i} style={[styles.dot, filled && styles.dotFilled]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.dot },
  dotFilled: { backgroundColor: colors.success },
});
