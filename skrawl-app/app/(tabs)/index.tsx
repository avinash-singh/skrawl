import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { FlatList } from 'react-native';
import { useThemeColors, typography, spacing } from '@/src/theme';
import { useUIStore } from '@/src/store/ui-store';
import { useNoteStore } from '@/src/store/note-store';
import { useFolderStore } from '@/src/store/folder-store';
import { RowItem } from '@/src/components/list/RowItem';
import { ContextToggle } from '@/src/components/common/ContextToggle';
import type { Note } from '@/src/models';
import Ionicons from '@expo/vector-icons/Ionicons';

type ListItem =
  | { type: 'header'; title: string }
  | { type: 'greeting' }
  | { type: 'note'; note: Note }
  | { type: 'done-toggle'; count: number };

export default function HomeScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const context = useUIStore((s) => s.context);
  const sortBy = useUIStore((s) => s.sortBy);
  const showDone = useUIStore((s) => s.showDone);
  const setShowDone = useUIStore((s) => s.setShowDone);
  const notes = useNoteStore((s) => s.notes);
  const loadNotes = useNoteStore((s) => s.loadNotes);
  const loadFolders = useFolderStore((s) => s.loadFolders);

  useEffect(() => {
    loadNotes(context);
    loadFolders(context);
  }, [context]);

  const { pinned, rest, done } = useMemo(() => {
    const active = notes.filter((n) => !n.isDone);
    const completed = notes.filter((n) => n.isDone);
    const sorted = [...active].sort((a, b) => {
      if (sortBy === 'priority') {
        const pa = a.priority ?? 99;
        const pb = b.priority ?? 99;
        if (pa !== pb) return pa - pb;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return {
      pinned: sorted.filter((n) => n.isPinned),
      rest: sorted.filter((n) => !n.isPinned),
      done: completed,
    };
  }, [notes, sortBy]);

  const listData: ListItem[] = useMemo(() => {
    const items: ListItem[] = [{ type: 'greeting' }];
    if (pinned.length > 0) {
      items.push({ type: 'header', title: `Pinned  ${pinned.length}` });
      pinned.forEach((n) => items.push({ type: 'note', note: n }));
    }
    if (rest.length > 0) {
      if (pinned.length > 0) items.push({ type: 'header', title: `All Items  ${rest.length}` });
      rest.forEach((n) => items.push({ type: 'note', note: n }));
    }
    if (done.length > 0) items.push({ type: 'done-toggle', count: done.length });
    if (showDone) done.forEach((n) => items.push({ type: 'note', note: n }));
    return items;
  }, [pinned, rest, done, showDone]);

  const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
    switch (item.type) {
      case 'greeting':
        return (
          <View style={[styles.greetingWrap, { paddingHorizontal: spacing.xl }]}>
            <View style={styles.greetingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.heading, { color: c.text }]}>Good morning, Avinash</Text>
                <Text style={[typography.caption, { color: c.textMuted, marginTop: 2, fontStyle: 'italic' }]}>
                  "Your mind is for having ideas, not holding them."
                </Text>
              </View>
              <View style={styles.greetingActions}>
                <ContextToggle />
                <Pressable onPress={() => router.push('/settings')} style={[styles.iconBtn, { borderColor: c.border, backgroundColor: c.bgCard }]}>
                  <Ionicons name="settings-outline" size={18} color={c.textDim} />
                </Pressable>
              </View>
            </View>
          </View>
        );
      case 'header':
        return (
          <View style={[styles.sectionLabel, { paddingHorizontal: spacing.xl }]}>
            <Text style={[typography.sectionHeader, { color: c.textMuted }]}>{item.title}</Text>
          </View>
        );
      case 'note':
        return (
          <View style={{ paddingHorizontal: spacing.xl, marginBottom: 6 }}>
            <RowItem note={item.note} index={index} />
          </View>
        );
      case 'done-toggle':
        return (
          <Pressable onPress={() => setShowDone(!showDone)} style={[styles.doneCta, { paddingHorizontal: spacing.xl }]}>
            <Ionicons name={showDone ? 'chevron-down' : 'chevron-forward'} size={14} color={c.textMuted} />
            <Text style={[typography.caption, { color: c.textMuted }]}>{item.count} completed</Text>
          </Pressable>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item, i) => (item.type === 'note' ? item.note.id : `${item.type}-${i}`)}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  greetingWrap: { paddingTop: 60, paddingBottom: 16 },
  greetingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  greetingActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { width: 42, height: 42, borderRadius: 100, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { paddingTop: 16, paddingBottom: 6 },
  doneCta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
});
