import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useThemeColors, radii } from '@/src/theme';
import { useNudgeStore } from '@/src/store/nudge-store';
import Ionicons from '@expo/vector-icons/Ionicons';

export function NudgeToast() {
  const c = useThemeColors();
  const message = useNudgeStore((s) => s.message);
  const dismiss = useNudgeStore((s) => s.dismiss);

  if (!message) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(250).springify()}
      exiting={FadeOutDown.duration(200)}
      style={[styles.toast, { backgroundColor: c.text }]}
    >
      <Ionicons name="sparkles" size={14} color={c.bg} />
      <Text style={[styles.text, { color: c.bg }]} numberOfLines={2}>{message}</Text>
      <Pressable onPress={dismiss} hitSlop={8}>
        <Ionicons name="close" size={14} color={c.bg} style={{ opacity: 0.5 }} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: radii.full,
    zIndex: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
