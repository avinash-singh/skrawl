import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useThemeColors, colors, radii } from '@/src/theme';
import { useUIStore, type SwipeAction } from '@/src/store/ui-store';
import type { PriorityLevel } from '@/src/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onPriorityChange?: (priority: PriorityLevel | null) => void;
  currentPriority?: PriorityLevel | null;
  isDone?: boolean;
  isPinned?: boolean;
}

const actionConfig: Record<SwipeAction, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = {
  done: { icon: 'checkmark-circle', label: 'Done', color: '#6AFFCB' },
  pin: { icon: 'pin', label: 'Pin', color: '#7C6AFF' },
  delete: { icon: 'trash', label: 'Delete', color: '#FF5A5A' },
  archive: { icon: 'archive', label: 'Archive', color: '#FFB86A' },
};

const priorityOptions: { value: PriorityLevel; label: string }[] = [
  { value: 0, label: 'P0' },
  { value: 1, label: 'P1' },
  { value: 2, label: 'P2' },
];

export function SwipeableRow({ children, onSwipeLeft, onSwipeRight, onPriorityChange, currentPriority, isDone, isPinned }: Props) {
  const c = useThemeColors();
  const swipeLeftAction = useUIStore((s) => s.swipeLeftAction);
  const swipeRightAction = useUIStore((s) => s.swipeRightAction);
  const swipeRef = useRef<Swipeable>(null);

  // Resolve label for contextual display
  const leftConfig = { ...actionConfig[swipeLeftAction] };
  if (swipeLeftAction === 'done' && isDone) {
    leftConfig.label = 'Undo';
    leftConfig.icon = 'arrow-undo';
  }
  const rightConfig = { ...actionConfig[swipeRightAction] };
  if (swipeRightAction === 'pin' && isPinned) {
    rightConfig.label = 'Unpin';
    rightConfig.icon = 'pin-outline';
  }

  // Left actions: reveals quick priority buttons
  const renderLeftActions = () => {
    if (!onPriorityChange) {
      return (
        <Pressable
          style={[styles.actionPane, styles.leftPane, { backgroundColor: rightConfig.color }]}
          onPress={() => {
            swipeRef.current?.close();
            onSwipeRight();
          }}
        >
          <Ionicons name={rightConfig.icon} size={22} color="#fff" />
          <Text style={styles.actionLabel}>{rightConfig.label}</Text>
        </Pressable>
      );
    }

    return (
      <View style={styles.priorityPane}>
        {priorityOptions.map((opt) => {
          const priColor = colors.priority[opt.value];
          const isActive = currentPriority === opt.value;
          return (
            <Pressable
              key={opt.value}
              style={[
                styles.priBtn,
                { backgroundColor: isActive ? priColor : `${priColor}22`, borderColor: priColor },
              ]}
              onPress={() => {
                onPriorityChange(isActive ? null : opt.value);
                swipeRef.current?.close();
              }}
            >
              <Text style={[styles.priText, { color: isActive ? '#fff' : priColor }]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderRightActions = () => (
    <Pressable
      style={[styles.actionPane, styles.rightPane, { backgroundColor: leftConfig.color }]}
      onPress={() => {
        swipeRef.current?.close();
        onSwipeLeft();
      }}
    >
      <Ionicons name={leftConfig.icon} size={22} color="#fff" />
      <Text style={styles.actionLabel}>{leftConfig.label}</Text>
    </Pressable>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      leftThreshold={onPriorityChange ? 40 : 80}
      rightThreshold={80}
      overshootLeft={false}
      overshootRight={false}
      onSwipeableOpen={(direction) => {
        if (direction === 'left' && !onPriorityChange) onSwipeRight();
        else if (direction === 'right') onSwipeLeft();
        if (!onPriorityChange || direction === 'right') swipeRef.current?.close();
      }}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionPane: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    borderRadius: radii.md,
    marginVertical: 0,
    gap: 4,
  },
  leftPane: {
    marginRight: 6,
  },
  rightPane: {
    marginLeft: 6,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  priorityPane: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    marginRight: 6,
  },
  priBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
