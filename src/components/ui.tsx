// Shared building blocks so every screen looks the same: big buttons, calm colours, one idea per screen.
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const colors = {
  background: '#FFFFFF',
  text: '#111111',
  muted: '#555555',
  primary: '#1F5FBF',
  primaryText: '#FFFFFF',
  card: '#F3F5F8',
  border: '#D9DEE5',
  success: '#1B6E3A',
  noticeBg: '#FFF4D6',
  noticeBorder: '#F0D58C',
  dot: '#C9D2DE',
};

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.title} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.heading} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Body({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && styles.muted]}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'quiet';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        kind === 'primary' && styles.buttonPrimary,
        kind === 'secondary' && styles.buttonSecondary,
        kind === 'quiet' && styles.buttonQuiet,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text
        style={[
          styles.buttonText,
          kind === 'primary' ? styles.buttonTextPrimary : styles.buttonTextSecondary,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

// One option in a row of choices (weekly goal, task length, Today/Tomorrow).
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function Checkbox({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}>
      <View style={[styles.checkBox, checked && styles.checkBoxChecked]}>
        {checked ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
      <Text style={styles.body}>{label}</Text>
    </Pressable>
  );
}

export function Notice({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.body}>{children}</Text>
      {action}
    </View>
  );
}

export function Row({ children, wrap = false }: { children: ReactNode; wrap?: boolean }) {
  return <View style={[styles.row, wrap && styles.wrap]}>{children}</View>;
}

export function Gap({ size = 16 }: { size?: number }) {
  return <View style={{ height: size }} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 12 },
  fill: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  heading: { fontSize: 20, fontWeight: '600', color: colors.text, marginTop: 8 },
  body: { fontSize: 17, lineHeight: 24, color: colors.text, flexShrink: 1 },
  muted: { color: colors.muted },
  button: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  buttonQuiet: { backgroundColor: 'transparent' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontSize: 18, fontWeight: '600' },
  buttonTextPrimary: { color: colors.primaryText },
  buttonTextSecondary: { color: colors.primary },
  pressed: { opacity: 0.7 },
  chip: {
    minHeight: 48,
    minWidth: 64,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 17, color: colors.text },
  chipTextSelected: { color: colors.primaryText, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  checkBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxChecked: { backgroundColor: colors.primary },
  checkMark: { color: colors.primaryText, fontSize: 18, fontWeight: '700' },
  notice: {
    backgroundColor: colors.noticeBg,
    borderColor: colors.noticeBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  wrap: { flexWrap: 'wrap' },
});
