import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors, typography, spacing, radii } from '@/src/theme';
import { useUIStore } from '@/src/store/ui-store';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SettingsScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={c.accent} />
          <Text style={{ color: c.accent, fontSize: 15, fontWeight: '500' }}>Back</Text>
        </Pressable>
        <Text style={[typography.label, { color: c.text, flex: 1, textAlign: 'center' }]}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={[styles.group, { paddingHorizontal: spacing.xl }]}>
        <Text style={[styles.groupLabel, { color: c.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <Pressable style={styles.row} onPress={toggleTheme}>
            <View style={[styles.rowIcon, { backgroundColor: c.accent }]}>
              <Ionicons name={theme === 'dark' ? 'moon' : 'sunny'} size={16} color="#fff" />
            </View>
            <Text style={[typography.body, { color: c.text, flex: 1 }]}>Dark Mode</Text>
            <View style={[styles.toggle, theme === 'dark' && styles.toggleOn, { backgroundColor: theme === 'dark' ? c.accent : c.bgInput }]}>
              <View style={[styles.toggleKnob, { transform: [{ translateX: theme === 'dark' ? 20 : 0 }] }]} />
            </View>
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.xl, paddingTop: 24 }}>
        <Text style={[typography.caption, { color: c.textMuted, textAlign: 'center' }]}>Skrawl v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 14, paddingBottom: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 60 },
  group: { marginTop: 24 },
  groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  card: { borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  toggle: { width: 51, height: 31, borderRadius: 16, justifyContent: 'center', padding: 2 },
  toggleOn: {},
  toggleKnob: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
});
