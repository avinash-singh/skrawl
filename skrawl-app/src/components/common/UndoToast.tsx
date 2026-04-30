import { useEffect } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors, typography, radii } from '@/src/theme';
import { useUndoStore } from '@/src/store/undo-store';
import Ionicons from '@expo/vector-icons/Ionicons';

const EASE_IN = { duration: 250, easing: Easing.out(Easing.cubic) };
const EASE_OUT = { duration: 200, easing: Easing.in(Easing.cubic) };

export function UndoToast() {
  const c = useThemeColors();
  const current = useUndoStore((s) => s.current);
  const execute = useUndoStore((s) => s.execute);
  const dismiss = useUndoStore((s) => s.dismiss);

  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (current) {
      translateY.value = withTiming(0, EASE_IN);
      opacity.value = withTiming(1, EASE_IN);
    } else {
      translateY.value = withTiming(80, EASE_OUT);
      opacity.value = withTiming(0, EASE_OUT);
    }
  }, [current]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents={current ? 'auto' : 'none'}
      style={[styles.toast, { backgroundColor: c.bgElevated, borderColor: c.border }, animatedStyle]}
    >
      <Ionicons name="arrow-undo" size={16} color={c.accent} />
      <Text style={[typography.label, { color: c.text, flex: 1 }]} numberOfLines={1}>
        {current?.label || ''}
      </Text>
      <Pressable onPress={execute} style={[styles.undoBtn, { backgroundColor: c.accentGlow }]}>
        <Text style={[styles.undoBtnText, { color: c.accent }]}>Undo</Text>
      </Pressable>
      <Pressable onPress={dismiss} hitSlop={8}>
        <Ionicons name="close" size={16} color={c.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 200,
  },
  undoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  undoBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
