import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useThemeColors, colors, radii } from '@/src/theme';
import type { PriorityLevel } from '@/src/theme/colors';

interface Props {
  currentPriority: PriorityLevel | null;
  onSelect: (priority: PriorityLevel | null) => void;
  onClose: () => void;
}

const options: { value: PriorityLevel; label: string }[] = [
  { value: 0, label: 'P0' },
  { value: 1, label: 'P1' },
  { value: 2, label: 'P2' },
  { value: 3, label: 'P3' },
];

export function QuickPriority({ currentPriority, onSelect, onClose }: Props) {
  const c = useThemeColors();

  return (
    <Animated.View entering={FadeIn.duration(150)} style={[styles.container, { backgroundColor: c.bgElevated, borderColor: c.border }]}>
      {options.map((opt) => {
        const priColor = colors.priority[opt.value];
        const selected = currentPriority === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.btn,
              { borderColor: selected ? priColor : c.border },
              selected && { backgroundColor: `${priColor}22` },
            ]}
            onPress={() => {
              onSelect(selected ? null : opt.value);
              onClose();
            }}
          >
            <Text style={[styles.label, { color: selected ? priColor : c.textDim }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
      <Pressable style={styles.closeBtn} onPress={onClose}>
        <Text style={[styles.label, { color: c.textMuted }]}>x</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
  },
  closeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
