import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useThemeColors, typography, radii, spacing } from '@/src/theme';
import type { Note } from '@/src/models';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  notes: Note[];
  onReorder: (orderedIds: string[]) => void;
  onDone: () => void;
}

const ROW_HEIGHT = 52;

export function DraggableList({ notes, onReorder, onDone }: Props) {
  const c = useThemeColors();
  const [order, setOrder] = useState<string[]>(notes.map((n) => n.id));
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const getNote = (id: string) => notes.find((n) => n.id === id);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setOrder((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    onReorder(order);
  }, [order, onReorder]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl }]}>
        <Text style={[typography.sectionHeader, { color: c.textMuted }]}>REORDER ITEMS</Text>
        <Pressable onPress={onDone} style={[styles.doneBtn, { backgroundColor: c.accent }]}>
          <Text style={[typography.caption, { color: '#fff', fontWeight: '700' }]}>Done</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.list} scrollEnabled={!draggingId}>
        {order.map((id, index) => {
          const note = getNote(id);
          if (!note) return null;

          return (
            <DraggableRow
              key={id}
              note={note}
              index={index}
              totalCount={order.length}
              isDragging={draggingId === id}
              onDragStart={() => setDraggingId(id)}
              onDragEnd={handleDragEnd}
              onMoveUp={() => {
                if (index > 0) moveItem(index, index - 1);
              }}
              onMoveDown={() => {
                if (index < order.length - 1) moveItem(index, index + 1);
              }}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

interface RowProps {
  note: Note;
  index: number;
  totalCount: number;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function DraggableRow({ note, index, totalCount, isDragging, onDragStart, onDragEnd, onMoveUp, onMoveDown }: RowProps) {
  const c = useThemeColors();

  return (
    <Animated.View
      style={[
        styles.row,
        {
          backgroundColor: isDragging ? c.bgElevated : c.bgCard,
          borderColor: isDragging ? c.accent : c.border,
        },
      ]}
    >
      {/* Drag handle + reorder buttons */}
      <View style={styles.dragControls}>
        <Pressable onPress={onMoveUp} disabled={index === 0} hitSlop={6}>
          <Ionicons name="chevron-up" size={16} color={index === 0 ? c.border : c.textDim} />
        </Pressable>
        <Ionicons name="reorder-three" size={20} color={c.textMuted} />
        <Pressable onPress={onMoveDown} disabled={index === totalCount - 1} hitSlop={6}>
          <Ionicons name="chevron-down" size={16} color={index === totalCount - 1 ? c.border : c.textDim} />
        </Pressable>
      </View>

      {/* Note info */}
      <View style={styles.rowBody}>
        <Text style={[typography.label, { color: c.text }]} numberOfLines={1}>
          {note.title || 'Untitled'}
        </Text>
        {note.priority !== null && (
          <Text style={[styles.priLabel, { color: c.textMuted }]}>P{note.priority}</Text>
        )}
      </View>

      <Text style={[typography.tiny, { color: c.textMuted }]}>#{index + 1}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: 4,
    minHeight: ROW_HEIGHT,
  },
  dragControls: {
    alignItems: 'center',
    gap: 0,
  },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  priLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});
