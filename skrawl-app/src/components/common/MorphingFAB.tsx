import { useEffect, useState } from 'react';
import { StyleSheet, Pressable, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors, radii } from '@/src/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  isCapturing: boolean;
  onTap: () => void;
  onLongPress: () => void;
}

const EASE = { duration: 250, easing: Easing.out(Easing.cubic) };

export function MorphingFAB({ isCapturing, onTap, onLongPress }: Props) {
  const c = useThemeColors();
  const scale = useSharedValue(1);
  const morph = useSharedValue(0);
  const holdPulse = useSharedValue(1);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    morph.value = withTiming(isCapturing ? 1 : 0, EASE);
  }, [isCapturing]);

  // Show tooltip on first render, dismiss after 4s
  useEffect(() => {
    if (!tooltipDismissed) {
      const t1 = setTimeout(() => setShowTooltip(true), 1500);
      const t2 = setTimeout(() => { setShowTooltip(false); setTooltipDismissed(true); }, 5500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, []);

  // Hold pulse animation
  useEffect(() => {
    if (isHolding) {
      holdPulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      );
    } else {
      holdPulse.value = withTiming(1, { duration: 200 });
    }
  }, [isHolding]);

  const fabStyle = useAnimatedStyle(() => {
    const translateY = interpolate(morph.value, [0, 1], [0, -100], Extrapolation.CLAMP);
    const rotate = interpolate(morph.value, [0, 1], [0, 90], Extrapolation.CLAMP);
    return {
      transform: [{ scale: scale.value }, { translateY }, { rotate: `${rotate}deg` }],
    };
  });

  const holdRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: holdPulse.value }],
    opacity: interpolate(holdPulse.value, [1, 1.15], [0.3, 0.1], Extrapolation.CLAMP),
  }));

  const addIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(morph.value, [0, 0.5], [1, 0], Extrapolation.CLAMP),
    position: 'absolute' as const,
  }));

  const closeIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(morph.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
    position: 'absolute' as const,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.92, { duration: 100 });
    setIsHolding(true);
    setShowTooltip(false);
    setTooltipDismissed(true);
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
    setIsHolding(false);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTap();
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress();
  };

  return (
    <Animated.View style={[styles.container, fabStyle]}>
      {/* Hold ring pulse */}
      {isHolding && (
        <Animated.View style={[styles.holdRing, { borderColor: c.accent }, holdRingStyle]} />
      )}

      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={400}
        style={[styles.fab, { backgroundColor: isCapturing ? c.danger : c.accent }]}
        accessibilityLabel="Create new item. Long press for voice input."
        accessibilityRole="button"
      >
        <Animated.View style={addIconStyle}>
          <Ionicons name="add" size={28} color="#fff" />
        </Animated.View>
        <Animated.View style={closeIconStyle}>
          <Ionicons name="close" size={28} color="#fff" />
        </Animated.View>

        {!isCapturing && (
          <View style={[styles.micBadge, { backgroundColor: c.accent2, borderColor: c.bg }]}>
            <Ionicons name="mic" size={10} color="#fff" />
          </View>
        )}
      </Pressable>

      {/* First-time tooltip */}
      {showTooltip && !isCapturing && (
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={[styles.tooltip, { backgroundColor: c.bgElevated, borderColor: c.border }]}>
          <Ionicons name="sparkles" size={14} color={c.accent} />
          <View>
            <Text style={[{ fontSize: 12, fontWeight: '600', color: c.text }]}>Tap to create</Text>
            <Text style={[{ fontSize: 10, fontWeight: '500', color: c.textDim }]}>Hold for voice input</Text>
          </View>
          <View style={[styles.tooltipArrow, { backgroundColor: c.bgElevated, borderColor: c.border }]} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 100,
    alignItems: 'center',
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C6AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  micBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  holdRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
  },
  tooltip: {
    position: 'absolute',
    right: 68,
    top: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 170,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipArrow: {
    position: 'absolute',
    right: -5,
    top: 15,
    width: 10,
    height: 10,
    transform: [{ rotate: '45deg' }],
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
});
