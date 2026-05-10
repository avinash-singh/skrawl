import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useThemeColors, radii } from '@/src/theme';
import { useUIStore } from '@/src/store/ui-store';
import Ionicons from '@expo/vector-icons/Ionicons';

export function ContextToggle() {
  const c = useThemeColors();
  const context = useUIStore((s) => s.context);
  const setContext = useUIStore((s) => s.setContext);

  return (
    <View style={[styles.wrap, { backgroundColor: c.bgCard, borderColor: c.border }]}>
      <Pressable
        style={[styles.btn, context === 'personal' && { backgroundColor: c.accent, borderRadius: radii.full }]}
        onPress={() => setContext('personal')}
      >
        <Ionicons name="person" size={12} color={context === 'personal' ? '#fff' : c.textMuted} />
        {context === 'personal' && <Text style={styles.label}>Personal</Text>}
      </Pressable>
      <Pressable
        style={[styles.btn, context === 'business' && { backgroundColor: '#3D8BFF', borderRadius: radii.full }]}
        onPress={() => setContext('business')}
      >
        <Ionicons name="briefcase" size={12} color={context === 'business' ? '#fff' : c.textMuted} />
        {context === 'business' && <Text style={styles.label}>Business</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: radii.full,
    borderWidth: 1,
    padding: 3,
    height: 36,
    position: 'relative',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 30,
    zIndex: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
