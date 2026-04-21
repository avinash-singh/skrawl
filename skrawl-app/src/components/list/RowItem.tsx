import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeColors, colors, typography, radii } from '@/src/theme';
import { useNoteStore } from '@/src/store/note-store';
import type { Note } from '@/src/models';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  note: Note;
  index: number;
}

const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  note: 'document-text-outline',
  list: 'checkbox-outline',
  task: 'checkmark-circle-outline',
};

export function RowItem({ note, index }: Props) {
  const c = useThemeColors();
  const toggleDone = useNoteStore((s) => s.toggleDone);
  const n = note;
  const d = n.isDone;

  // Color for stripe and type icon
  const noteColor = colors.noteColors[n.color] || null;
  const accentColor = noteColor || c.accent;
  const accentBg = noteColor
    ? `${noteColor}18`  // ~10% opacity hex
    : c.accentGlow;

  // Subtitle parts
  const subParts: string[] = [];
  if (n.items.length > 0) {
    const doneCount = n.items.filter((i) => i.isDone).length;
    subParts.push(`${doneCount}/${n.items.length}`);
    const undone = n.items.filter((i) => !i.isDone).slice(0, 2).map((i) => i.text).join(', ');
    if (undone) subParts.push(undone);
  } else if (n.body) {
    subParts.push(n.body.split('\n')[0].substring(0, 50));
  }
  const subtitle = subParts.join(' · ');

  // Priority
  const pri = n.priority;
  const priColor = pri !== null ? colors.priority[pri] : null;

  return (
    <View style={[styles.wrap, { backgroundColor: c.bgCard, borderColor: c.border }]}>
      {/* Left accent stripe */}
      {!d && <View style={[styles.stripe, { backgroundColor: accentColor }]} />}

      {/* Checkbox */}
      <Pressable
        onPress={() => toggleDone(n.id)}
        style={[styles.checkbox, d ? styles.checkboxDone : { borderColor: c.border2 }]}
      >
        {d && <Ionicons name="checkmark" size={14} color="#fff" />}
      </Pressable>

      {/* Type icon */}
      <View style={[styles.typeIcon, { backgroundColor: accentBg }]}>
        <Ionicons name={typeIcons[n.type] || 'document-text-outline'} size={14} color={accentColor} />
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text
          style={[
            typography.label,
            { color: d ? c.textMuted : c.text },
            d && styles.strikethrough,
          ]}
          numberOfLines={1}
        >
          {n.title || 'Untitled'}
        </Text>
        {subtitle ? (
          <Text style={[typography.tiny, { color: c.textDim, marginTop: 2 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Trailing */}
      <View style={styles.trailing}>
        {n.isPinned && !d && <Ionicons name="pin" size={13} color={c.accent} />}
        {priColor && !d && (
          <View style={[styles.priBadge, { backgroundColor: `${priColor}22` }]}>
            <Text style={[styles.priText, { color: priColor }]}>P{pri}</Text>
          </View>
        )}
      </View>

      {/* Progress bar for lists */}
      {n.items.length > 0 && !d && (
        <View style={[styles.progressBar, { backgroundColor: c.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: accentColor,
                width: `${Math.round((n.items.filter((i) => i.isDone).length / n.items.length) * 100)}%`,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    paddingLeft: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 52,
    position: 'relative',
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: '15%',
    bottom: '15%',
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    borderWidth: 0,
    backgroundColor: '#7C6AFF',
  },
  typeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  priBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  priText: {
    fontSize: 10,
    fontWeight: '800',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  progressFill: {
    height: 2,
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1,
  },
});
