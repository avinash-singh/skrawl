import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, typography } from '@/src/theme';

export default function CalendarScreen() {
  const c = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Text style={[typography.heading, { color: c.text, paddingTop: 60, paddingHorizontal: 20 }]}>Calendar</Text>
      <Text style={[typography.caption, { color: c.textMuted, paddingHorizontal: 20, marginTop: 8 }]}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
