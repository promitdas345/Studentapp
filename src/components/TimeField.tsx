// A tappable clock time ('HH:mm'). Android opens the system time dialog through the imperative API,
// which the picker's README recommends for Android; iOS shows the compact inline picker.
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { formatTime } from '../lib/time';
import { colors } from './ui';

// The picker works with JS Dates in the phone's own time zone; we only use the clock part.
function toPickerDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function fromPickerDate(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function TimeField({
  value,
  onChange,
  accessibilityLabel,
}: {
  value: string;
  onChange: (time: string) => void;
  accessibilityLabel: string;
}) {
  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={toPickerDate(value)}
        mode="time"
        display="compact"
        accessibilityLabel={accessibilityLabel}
        onValueChange={(_event, date) => onChange(fromPickerDate(date))}
      />
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() =>
        DateTimePickerAndroid.open({
          value: toPickerDate(value),
          mode: 'time',
          is24Hour: false,
          onValueChange: (_event, date) => onChange(fromPickerDate(date)),
        })
      }
      style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
      <Text style={styles.text}>{formatTime(value)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
  },
  text: { fontSize: 20, fontWeight: '600', color: colors.text },
  pressed: { opacity: 0.7 },
});
