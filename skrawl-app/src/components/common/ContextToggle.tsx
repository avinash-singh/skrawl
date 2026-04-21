import { View, Pressable, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useThemeColors, radii } from '@/src/theme';
import { useUIStore } from '@/src/store/ui-store';
import Ionicons from '@expo/vector-icons/Ionicons';

export function ContextToggle() {
  const c = useThemeColors();
  const context = useUIStore((s) => s.context);
  const setContext = useUIStore((s) => s.setContext);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(context === 'personal' ? 0 : 39, { damping: 15, stiffness: 200 }) }],
    backgroundColor: context === 'personal' ? c.accent : '#3D8BFF',
  }));

  return (
    <View style={[styles.wrap, { backgroundColor: c.bgCard, borderColor: c.border }]}>
      <Animated.View style={[styles.pill, pillStyle]} />
      <Pressable style={styles.btn} onPress={() => setContext('personal')}>
        <Ionicons name="person" size={14} color={context === 'personal' ? '#fff' : c.textMuted} />
      </Pressable>
      <Pressable style={styles.btn} onPress={() => setContext('business')}>
        <Ionicons name="briefcase" size={14} color={context === 'business' ? '#fff' : c.textMuted} />
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
    height: 42,
    width: 84,
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 37,
    height: 34,
    borderRadius: radii.full,
  },
  btn: {
    width: 39,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
