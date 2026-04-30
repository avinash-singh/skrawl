import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useThemeColors, typography, radii } from '@/src/theme';
import { useUIStore, type SortBy } from '@/src/store/ui-store';
import Ionicons from '@expo/vector-icons/Ionicons';

const options: { value: SortBy; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'priority', label: 'Priority', icon: 'flag' },
  { value: 'date', label: 'Recent', icon: 'time' },
];

export function SortDropdown() {
  const c = useThemeColors();
  const sortBy = useUIStore((s) => s.sortBy);
  const setSortBy = useUIStore((s) => s.setSortBy);
  const [open, setOpen] = useState(false);

  const current = options.find((o) => o.value === sortBy) || options[0];

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.trigger, { backgroundColor: c.bgCard, borderColor: c.border }]}
        onPress={() => setOpen(!open)}
      >
        <Ionicons name={current.icon} size={11} color={c.textDim} />
        <Text style={[styles.triggerText, { color: c.textDim }]}>{current.label}</Text>
        <Ionicons
          name="chevron-down"
          size={10}
          color={c.textMuted}
          style={open ? { transform: [{ rotate: '180deg' }] } : undefined}
        />
      </Pressable>

      {open && (
        <Animated.View
          entering={FadeIn.duration(120)}
          exiting={FadeOut.duration(80)}
          style={[styles.menu, { backgroundColor: c.bgElevated, borderColor: c.border }]}
        >
          {options.map((opt) => {
            const selected = sortBy === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.menuItem, selected && { backgroundColor: c.accentGlow }]}
                onPress={() => {
                  setSortBy(opt.value);
                  setOpen(false);
                }}
              >
                <Ionicons name={opt.icon} size={14} color={selected ? c.accent : c.textDim} />
                <Text style={[styles.menuText, { color: selected ? c.accent : c.text }]}>
                  {opt.label}
                </Text>
                {selected && (
                  <Ionicons name="checkmark" size={14} color={c.accent} style={{ marginLeft: 'auto' }} />
                )}
              </Pressable>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 30,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  triggerText: {
    fontSize: 11,
    fontWeight: '600',
  },
  menu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    minWidth: 150,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
