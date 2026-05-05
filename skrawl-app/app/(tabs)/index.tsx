import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useThemeColors, colors, typography, spacing, radii } from '@/src/theme';
import { useUIStore } from '@/src/store/ui-store';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useNoteStore } from '@/src/store/note-store';
import { useFolderStore } from '@/src/store/folder-store';
import { useUndoStore } from '@/src/store/undo-store';
import { useReminderStore } from '@/src/store/reminder-store';
import { getQuote } from '@/src/services/nudges';
import { useNudgeStore } from '@/src/store/nudge-store';
import { RowItem } from '@/src/components/list/RowItem';
import { SwipeableRow } from '@/src/components/list/SwipeableRow';
import { ContextToggle } from '@/src/components/common/ContextToggle';
import { SortDropdown } from '@/src/components/common/SortDropdown';
import { MorphingFAB } from '@/src/components/common/MorphingFAB';
import { QuickCapture } from '@/src/components/capture/QuickCapture';
import { VoiceInput } from '@/src/components/capture/VoiceInput';
import { DetailSheet } from '@/src/components/detail/DetailSheet';
import { UndoToast } from '@/src/components/common/UndoToast';
import { FolderDrawer } from '@/src/components/folders/FolderDrawer';
import { QuickPriority } from '@/src/components/list/QuickPriority';
import { DraggableList } from '@/src/components/list/DraggableList';
import type { Note } from '@/src/models';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

type ListItem =
  | { type: 'header'; title: string; key: string }
  | { type: 'greeting'; key: string }
  | { type: 'ai-banner'; key: string }
  | { type: 'note'; note: Note; key: string }
  | { type: 'done-toggle'; count: number; key: string };

export default function HomeScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const context = useUIStore((s) => s.context);
  const sortBy = useUIStore((s) => s.sortBy);
  const showDone = useUIStore((s) => s.showDone);
  const setShowDone = useUIStore((s) => s.setShowDone);
  const swipeLeftAction = useUIStore((s) => s.swipeLeftAction);
  const swipeRightAction = useUIStore((s) => s.swipeRightAction);
  const notes = useNoteStore((s) => s.notes);
  const loadNotes = useNoteStore((s) => s.loadNotes);
  const toggleDone = useNoteStore((s) => s.toggleDone);
  const togglePin = useNoteStore((s) => s.togglePin);
  const deleteNote = useNoteStore((s) => s.deleteNote);
  const restoreNote = useNoteStore((s) => s.restoreNote);
  const loadFolders = useFolderStore((s) => s.loadFolders);
  const pushUndo = useUndoStore((s) => s.push);
  const reminders = useReminderStore((s) => s.reminders);
  const loadReminders = useReminderStore((s) => s.loadReminders);
  const vibeValue = useUIStore((s) => s.vibeValue);
  const setContext = useUIStore((s) => s.setContext);
  const { onNoteCompleted, onAllP0sClear, onNoteDeleted } = useNudgeStore();

  const switchContext = useCallback(() => {
    setContext(context === 'personal' ? 'business' : 'personal');
  }, [context, setContext]);

  const contextSwipe = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-10, 10])
    .onEnd((e) => {
      'worklet';
      if (Math.abs(e.translationX) > 80) {
        runOnJS(switchContext)();
      }
    });

  const currentFolder = useUIStore((s) => s.currentFolder);
  const setCurrentFolder = useUIStore((s) => s.setCurrentFolder);
  const folders = useFolderStore((s) => s.folders);

  const [captureVisible, setCaptureVisible] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [detailNoteId, setDetailNoteId] = useState<string | null>(null);
  const [folderDrawerOpen, setFolderDrawerOpen] = useState(false);
  const [quickPriorityNoteId, setQuickPriorityNoteId] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [aiBannerExpanded, setAiBannerExpanded] = useState(false);

  const updateNote = useNoteStore((s) => s.updateNote);
  const getNoteById = useNoteStore((s) => s.getNoteById);
  const reorderNotes = useNoteStore((s) => s.reorderNotes);

  useEffect(() => {
    loadNotes(context);
    loadFolders(context);
    loadReminders();
  }, [context]);

  const { pinned, rest, done } = useMemo(() => {
    const filtered = currentFolder
      ? notes.filter((n) => n.folderId === currentFolder)
      : notes;
    const active = filtered.filter((n) => !n.isDone);
    const completed = filtered.filter((n) => n.isDone);
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
  }, [notes, sortBy, currentFolder]);

  // Upcoming reminders
  const upcomingReminders = useMemo(() => {
    const now = new Date();
    return reminders
      .filter((r) => new Date(r.remindAt) >= now)
      .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime())
      .slice(0, 3);
  }, [reminders]);

  // AI insight — smart, contextual, interactive
  const aiInsight = useMemo(() => {
    // Only use notes in the current context that aren't deleted
    const noteIds = new Set(notes.map((n) => n.id));
    const active = notes.filter((n) => !n.isDone && !n.deletedAt);
    const p0s = active.filter((n) => n.priority === 0);
    const p1s = active.filter((n) => n.priority === 1);
    // Only use reminders that belong to notes in the current context
    const contextReminders = reminders.filter((r) => noteIds.has(r.noteId));
    const overdue = contextReminders.filter((r) => new Date(r.remindAt) < new Date());
    const noPriority = active.filter((n) => n.priority === null);
    const stale = active.filter((n) => {
      const age = Date.now() - new Date(n.updatedAt).getTime();
      return age > 3 * 24 * 60 * 60 * 1000; // 3+ days old
    });

    // Priority: too many P0s
    if (p0s.length >= 5) {
      return {
        type: 'p0-overload' as const,
        icon: 'alert-circle' as const,
        iconColor: '#FF5A5A',
        text: `${p0s.length} items at P0 — everything can't be critical`,
        subtext: 'Tap to review and re-prioritize',
        actions: p0s.slice(0, 3).map((n) => ({ id: n.id, title: n.title, label: 'Downgrade to P1' })),
      };
    }

    // Due soon — suggest upgrading to P0
    const now = new Date();
    const twoDays = 2 * 24 * 60 * 60 * 1000;
    const dueSoon = contextReminders
      .filter((r) => {
        const remindTime = new Date(r.remindAt).getTime();
        const delta = remindTime - now.getTime();
        return delta > 0 && delta < twoDays; // due within 2 days
      })
      .map((r) => {
        const note = active.find((n) => n.id === r.noteId);
        return note && note.priority !== 0 ? { note, reminder: r } : null;
      })
      .filter(Boolean) as { note: Note; reminder: typeof reminders[0] }[];

    if (dueSoon.length > 0) {
      const timeLeft = (ms: number) => {
        const mins = Math.round(ms / 60000);
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ${mins % 60}m`;
        const days = Math.floor(hrs / 24);
        return days === 1 ? `1 day` : `${days} days`;
      };
      return {
        type: 'due-soon' as const,
        icon: 'trending-up' as const,
        iconColor: '#FF6AC2',
        text: `"${dueSoon[0].note.title}" is due in ${timeLeft(new Date(dueSoon[0].reminder.remindAt).getTime() - now.getTime())}`,
        subtext: dueSoon[0].note.priority !== null ? `Currently P${dueSoon[0].note.priority} — upgrade to critical?` : 'No priority set — make it critical?',
        actions: [
          ...dueSoon.slice(0, 2).map((d) => ({ id: d.note.id, title: d.note.title, label: 'Upgrade to P0' })),
          { id: dueSoon[0].note.id, title: '', label: 'Open' },
        ],
      };
    }

    // Overdue reminders
    if (overdue.length > 0) {
      const overdueNote = notes.find((n) => n.id === overdue[0].noteId);
      return {
        type: 'overdue' as const,
        icon: 'alarm' as const,
        iconColor: '#FFB86A',
        text: `${overdue.length} overdue reminder${overdue.length > 1 ? 's' : ''} — "${overdueNote?.title || 'Untitled'}"`,
        subtext: 'Reschedule or mark done',
        actions: [
          { id: overdueNote?.id || '', title: 'Reschedule to tomorrow', label: 'Tomorrow' },
          { id: overdueNote?.id || '', title: 'Mark as done', label: 'Done' },
        ],
      };
    }

    // Items without priority
    if (noPriority.length >= 3) {
      return {
        type: 'unorganized' as const,
        icon: 'flag-outline' as const,
        iconColor: '#6AB4FF',
        text: `${noPriority.length} items have no priority set`,
        subtext: 'Set priorities to stay on top of what matters',
        actions: noPriority.slice(0, 2).map((n) => ({ id: n.id, title: n.title, label: 'Set priority' })),
      };
    }

    // Stale items
    if (stale.length >= 2) {
      return {
        type: 'stale' as const,
        icon: 'time-outline' as const,
        iconColor: '#B06AFF',
        text: `${stale.length} items untouched for 3+ days`,
        subtext: 'Still relevant? Complete or archive them',
        actions: stale.slice(0, 2).map((n) => ({ id: n.id, title: n.title, label: 'Archive' })),
      };
    }

    // P0/P1 focus suggestion
    if (p0s.length > 0 || p1s.length > 0) {
      const top = p0s[0] || p1s[0];
      return {
        type: 'focus' as const,
        icon: 'flash-outline' as const,
        iconColor: c.accent,
        text: `Focus: "${top.title}"`,
        subtext: `${p0s.length + p1s.length} high-priority item${p0s.length + p1s.length > 1 ? 's' : ''} remaining`,
        actions: [{ id: top.id, title: 'Open', label: 'Start now' }],
      };
    }

    // Active items but no special conditions
    if (active.length > 0) {
      const top = active[0];
      return {
        type: 'focus' as const,
        icon: 'list-outline' as const,
        iconColor: c.accent,
        text: `${active.length} item${active.length > 1 ? 's' : ''} — "${top.title}" is next`,
        subtext: 'Tap to see your notes',
        actions: [{ id: top.id, title: 'Open', label: 'Start' }],
      };
    }

    // Truly all clear
    return {
      type: 'clear' as const,
      icon: 'checkmark-circle-outline' as const,
      iconColor: '#6AFFCB',
      text: 'All clear — inbox zero!',
      subtext: 'Great time to capture new ideas',
      actions: [] as { id: string; title: string; label: string }[],
    };
  }, [notes, reminders, c.accent]);

  const listData: ListItem[] = useMemo(() => {
    const items: ListItem[] = [
      { type: 'greeting', key: 'greeting' },
      { type: 'ai-banner', key: 'ai-banner' },
    ];
    if (pinned.length > 0) {
      items.push({ type: 'header', title: `Pinned  ${pinned.length}`, key: 'header-pinned' });
      pinned.forEach((n) => items.push({ type: 'note', note: n, key: n.id }));
    }
    if (rest.length > 0) {
      if (pinned.length > 0) items.push({ type: 'header', title: `All Items  ${rest.length}`, key: 'header-all' });
      rest.forEach((n) => items.push({ type: 'note', note: n, key: n.id }));
    }
    if (done.length > 0) items.push({ type: 'done-toggle', count: done.length, key: 'done-toggle' });
    if (showDone) done.forEach((n) => items.push({ type: 'note', note: n, key: n.id }));
    return items;
  }, [pinned, rest, done, showDone]);

  // Swipe action handlers
  const executeSwipeAction = useCallback(
    (action: string, note: Note) => {
      switch (action) {
        case 'done':
          toggleDone(note.id);
          if (!note.isDone) {
            onNoteCompleted(vibeValue);
            const remainingP0 = notes.filter((n) => !n.isDone && n.id !== note.id && n.priority === 0);
            if (remainingP0.length === 0 && note.priority === 0) {
              onAllP0sClear(vibeValue);
            }
          }
          pushUndo(note.isDone ? 'Marked as incomplete' : 'Marked as done', async () => { await toggleDone(note.id); });
          break;
        case 'pin':
          togglePin(note.id);
          pushUndo(note.isPinned ? 'Unpinned' : 'Pinned', async () => { await togglePin(note.id); });
          break;
        case 'delete':
          deleteNote(note.id);
          onNoteDeleted(vibeValue);
          pushUndo('Deleted', async () => { await restoreNote(note.id); await loadNotes(context); });
          break;
        case 'archive':
          deleteNote(note.id);
          onNoteDeleted(vibeValue);
          pushUndo('Archived', async () => { await restoreNote(note.id); await loadNotes(context); });
          break;
      }
    },
    [context, toggleDone, togglePin, deleteNote, restoreNote, loadNotes, pushUndo]
  );

  // Multi-select handlers
  const toggleSelect = (noteId: string) => {
    setSelectedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      if (next.size === 0) setMultiSelectMode(false);
      return next;
    });
  };

  const bulkDelete = () => {
    selectedNotes.forEach((id) => deleteNote(id));
    pushUndo(`Deleted ${selectedNotes.size} items`, async () => {
      for (const id of selectedNotes) { await restoreNote(id); }
      await loadNotes(context);
    });
    setSelectedNotes(new Set());
    setMultiSelectMode(false);
  };

  const bulkDone = () => {
    selectedNotes.forEach((id) => toggleDone(id));
    setSelectedNotes(new Set());
    setMultiSelectMode(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    switch (item.type) {
      case 'greeting':
        return (
          <View style={[styles.greetingWrap, { paddingHorizontal: spacing.xl }]}>
            <View style={styles.logoRow}>
              <Text style={styles.logoText}>
                <Text style={{ color: c.text }}>Skrawl</Text>
                <Text style={{ color: '#FF6AC2' }}>.</Text>
              </Text>
              <View style={styles.greetingActions}>
                <ContextToggle />
                <Pressable
                  onPress={() => router.push('/settings')}
                  style={[styles.iconBtn, { borderColor: c.border, backgroundColor: c.bgCard }]}
                >
                  <Ionicons name="settings-outline" size={18} color={c.textDim} />
                </Pressable>
              </View>
            </View>
            <View style={{ marginTop: 4 }}>
              <Text style={[typography.caption, { color: c.textMuted }]}>{getGreeting()}, Avinash</Text>
              <Text style={[{ fontSize: 12, color: c.textDim, fontStyle: 'italic', marginTop: 2 }]}>
                "{getQuote(vibeValue)}"
              </Text>
            </View>
            {/* Sort + folder row */}
            <View style={styles.sortRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <SortDropdown />
                <Pressable
                  style={[styles.folderBtn, { borderColor: currentFolder ? c.accent : c.border, backgroundColor: currentFolder ? c.accentGlow : 'transparent' }]}
                  onPress={() => setFolderDrawerOpen(true)}
                >
                  <Ionicons name="folder-outline" size={13} color={currentFolder ? c.accent : c.textDim} />
                  <Text style={[typography.caption, { color: currentFolder ? c.accent : c.textDim }]} numberOfLines={1}>
                    {currentFolder ? (folders.find((f) => f.id === currentFolder)?.name || 'Folder') : 'All'}
                  </Text>
                </Pressable>
              </View>
              <Text style={[typography.caption, { color: c.textMuted }]}>{(pinned.length + rest.length)} items</Text>
            </View>
          </View>
        );

      case 'ai-banner': {
        // Collect the relevant notes for this insight
        const insightNotes: Note[] = (() => {
          const active = notes.filter((n) => !n.isDone && !n.deletedAt);
          const noteIds = new Set(notes.map((n) => n.id));
          const ctxReminders = reminders.filter((r) => noteIds.has(r.noteId));
          let raw: Note[];
          switch (aiInsight.type) {
            case 'p0-overload': raw = active.filter((n) => n.priority === 0); break;
            case 'overdue': raw = ctxReminders.filter((r) => new Date(r.remindAt) < new Date()).map((r) => notes.find((n) => n.id === r.noteId)).filter(Boolean) as Note[]; break;
            case 'due-soon': raw = aiInsight.actions.map((a) => getNoteById(a.id)).filter(Boolean) as Note[]; break;
            case 'unorganized': raw = active.filter((n) => n.priority === null).slice(0, 5); break;
            case 'stale': raw = active.filter((n) => Date.now() - new Date(n.updatedAt).getTime() > 3 * 24 * 60 * 60 * 1000).slice(0, 5); break;
            case 'focus': raw = active.filter((n) => n.priority !== null && n.priority <= 1).slice(0, 3); break;
            default: raw = [];
          }
          // Deduplicate by id
          const seen = new Set<string>();
          return raw.filter((n) => { if (seen.has(n.id)) return false; seen.add(n.id); return true; });
        })();

        return (
          <Pressable
            style={[styles.aiBanner, { backgroundColor: `${aiInsight.iconColor}12`, borderColor: `${aiInsight.iconColor}25` }]}
            onPress={() => insightNotes.length > 0 && setAiBannerExpanded(!aiBannerExpanded)}
          >
            <View style={[styles.aiBannerGlow, { backgroundColor: aiInsight.iconColor }]} />
            {/* Header row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 1 }}>
              <View style={[styles.aiBannerIcon, { backgroundColor: `${aiInsight.iconColor}25`, borderColor: `${aiInsight.iconColor}40`, borderWidth: 1 }]}>
                <Ionicons name={aiInsight.icon} size={18} color={aiInsight.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aiBannerText, { color: c.text }]} numberOfLines={2}>{aiInsight.text}</Text>
                <Text style={[{ fontSize: 11, color: c.textDim, marginTop: 2 }]}>{aiInsight.subtext}</Text>
              </View>
              {insightNotes.length > 0 && (
                <Ionicons name={aiBannerExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={c.textMuted} />
              )}
            </View>

            {/* Expanded — inline priority + reminder controls per note */}
            {aiBannerExpanded && insightNotes.length > 0 && (
              <View style={[styles.aiExpanded, { borderTopColor: `${aiInsight.iconColor}20`, zIndex: 1 }]}>
                {insightNotes.map((note) => {
                  const noteReminder = reminders.find((r) => r.noteId === note.id);
                  return (
                    <View key={note.id} style={[styles.aiNoteCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
                      {/* Note title + open */}
                      <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }} onPress={() => { setAiBannerExpanded(false); setDetailNoteId(note.id); }}>
                        <Text style={[{ fontSize: 13, fontWeight: '600', color: c.text, flex: 1 }]} numberOfLines={1}>{note.title || 'Untitled'}</Text>
                        <Ionicons name="open-outline" size={12} color={c.textMuted} />
                      </Pressable>

                      {/* Priority row */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Ionicons name="flag-outline" size={11} color={c.textMuted} />
                        {[0, 1, 2].map((p) => {
                          const pc = colors.priority[p as 0 | 1 | 2];
                          const sel = note.priority === p;
                          return (
                            <Pressable
                              key={p}
                              style={[styles.aiPriBtn, { borderColor: sel ? pc : c.border, backgroundColor: sel ? `${pc}22` : 'transparent' }]}
                              onPress={() => { const n = getNoteById(note.id); if (n) updateNote({ ...n, priority: p as any }); }}
                            >
                              <Text style={[{ fontSize: 10, fontWeight: '700', color: sel ? pc : c.textDim }]}>P{p}</Text>
                            </Pressable>
                          );
                        })}
                        {note.priority !== null && (
                          <Pressable onPress={() => { const n = getNoteById(note.id); if (n) updateNote({ ...n, priority: null as any }); }}>
                            <Ionicons name="close-circle-outline" size={14} color={c.textMuted} />
                          </Pressable>
                        )}
                      </View>

                      {/* Reminder row */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="alarm-outline" size={11} color={c.textMuted} />
                        {noteReminder ? (
                          <>
                            <Text style={[{ fontSize: 10, color: c.accent, fontWeight: '600' }]}>
                              {new Date(noteReminder.remindAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Text>
                            <Pressable
                              style={[styles.aiPriBtn, { borderColor: c.border }]}
                              onPress={() => { setAiBannerExpanded(false); setDetailNoteId(note.id); }}
                            >
                              <Text style={[{ fontSize: 10, fontWeight: '600', color: c.textDim }]}>Change</Text>
                            </Pressable>
                          </>
                        ) : (
                          <>
                            {[{ label: '+1d', hours: 24 }, { label: '+3d', hours: 72 }, { label: '+1w', hours: 168 }].map((r) => (
                              <Pressable
                                key={r.label}
                                style={[styles.aiPriBtn, { borderColor: c.border }]}
                                onPress={async () => {
                                  const addReminder = useReminderStore.getState().addReminder;
                                  await addReminder({
                                    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                                    noteId: note.id,
                                    remindAt: new Date(Date.now() + r.hours * 60 * 60 * 1000).toISOString(),
                                    calendarEventId: null,
                                    status: 'pending',
                                    aiSuggested: false,
                                    autoSet: false,
                                    createdAt: new Date().toISOString(),
                                    isDirty: true,
                                  }, note.title);
                                }}
                              >
                                <Text style={[{ fontSize: 10, fontWeight: '600', color: c.textDim }]}>{r.label}</Text>
                              </Pressable>
                            ))}
                          </>
                        )}
                        {/* Done button */}
                        <Pressable
                          style={[styles.aiPriBtn, { borderColor: `${c.accent3}40`, marginLeft: 'auto' }]}
                          onPress={() => { toggleDone(note.id); onNoteCompleted(vibeValue); }}
                        >
                          <Ionicons name="checkmark" size={10} color={c.accent3} />
                          <Text style={[{ fontSize: 10, fontWeight: '700', color: c.accent3 }]}>Done</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Pressable>
        );
      }

      case 'header':
        return (
          <View style={[styles.sectionLabel, { paddingHorizontal: spacing.xl }]}>
            <Text style={[typography.sectionHeader, { color: c.textMuted }]}>{item.title}</Text>
          </View>
        );

      case 'note':
        return (
          <View style={{ paddingHorizontal: spacing.xl, marginBottom: 6 }}>
            {multiSelectMode ? (
              <Pressable onPress={() => toggleSelect(item.note.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.selectBox, selectedNotes.has(item.note.id) && { backgroundColor: c.accent, borderColor: c.accent }]}>
                  {selectedNotes.has(item.note.id) && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <RowItem note={item.note} index={0} onPress={() => toggleSelect(item.note.id)} />
                </View>
              </Pressable>
            ) : quickPriorityNoteId === item.note.id ? (
              <QuickPriority
                currentPriority={item.note.priority}
                onSelect={(pri) => { const note = getNoteById(item.note.id); if (note) updateNote({ ...note, priority: pri }); }}
                onClose={() => setQuickPriorityNoteId(null)}
              />
            ) : (
              <SwipeableRow
                onSwipeLeft={() => executeSwipeAction(swipeLeftAction, item.note)}
                onSwipeRight={() => executeSwipeAction(swipeRightAction, item.note)}
                onPriorityChange={(pri) => { const note = getNoteById(item.note.id); if (note) updateNote({ ...note, priority: pri }); }}
                currentPriority={item.note.priority}
                isDone={item.note.isDone}
                isPinned={item.note.isPinned}
              >
                <RowItem
                  note={item.note}
                  index={0}
                  onPress={() => { setCaptureVisible(false); setVoiceMode(false); setDetailNoteId(item.note.id); }}
                  onLongPress={() => {
                    setMultiSelectMode(true);
                    setSelectedNotes(new Set([item.note.id]));
                  }}
                />
              </SwipeableRow>
            )}
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

  if (reorderMode) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={{ paddingTop: 60 }} />
        <DraggableList notes={[...pinned, ...rest]} onReorder={(ids) => reorderNotes(ids)} onDone={() => setReorderMode(false)} />
      </View>
    );
  }

  return (
    <GestureDetector gesture={contextSwipe}>
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <FlashList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingBottom: 120 }}
        getItemType={(item) => item.type}
        extraData={`${aiInsight.type}-${aiInsight.text}-${notes.length}`}
      />

      {!detailNoteId && (
        <MorphingFAB
          isCapturing={captureVisible || voiceMode}
          onTap={() => { voiceMode ? setVoiceMode(false) : setCaptureVisible(!captureVisible); }}
          onLongPress={() => { setCaptureVisible(false); Keyboard.dismiss(); setVoiceMode(true); }}
        />
      )}

      <VoiceInput visible={voiceMode && !detailNoteId} onClose={() => setVoiceMode(false)} onCreated={(id) => { setVoiceMode(false); setDetailNoteId(id); }} />

      {captureVisible && !voiceMode && !detailNoteId && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.captureWrap} keyboardVerticalOffset={0}>
          <QuickCapture visible={captureVisible} onClose={() => setCaptureVisible(false)} onOpenDetail={(id) => setDetailNoteId(id)} />
        </KeyboardAvoidingView>
      )}

      <DetailSheet noteId={detailNoteId} onDismiss={() => setDetailNoteId(null)} />
      <UndoToast />

      <FolderDrawer visible={folderDrawerOpen} onClose={() => setFolderDrawerOpen(false)} />

      {/* Multi-select floating bar */}
      {multiSelectMode && selectedNotes.size > 0 && (
        <View style={[styles.multiBar, { backgroundColor: c.bgElevated, borderColor: c.border }]}>
          <Text style={[typography.label, { color: c.text, flex: 1 }]}>{selectedNotes.size} selected</Text>
          <Pressable onPress={bulkDone} style={[styles.multiBtn, { backgroundColor: c.accent3 }]}>
            <Ionicons name="checkmark" size={16} color="#000" />
            <Text style={[{ fontSize: 12, fontWeight: '700', color: '#000' }]}>Done</Text>
          </Pressable>
          <Pressable onPress={bulkDelete} style={[styles.multiBtn, { backgroundColor: c.danger }]}>
            <Ionicons name="trash" size={16} color="#fff" />
            <Text style={[{ fontSize: 12, fontWeight: '700', color: '#fff' }]}>Delete</Text>
          </Pressable>
          <Pressable onPress={() => { setMultiSelectMode(false); setSelectedNotes(new Set()); }}>
            <Ionicons name="close" size={20} color={c.textDim} />
          </Pressable>
        </View>
      )}
    </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  greetingWrap: { paddingTop: 60, paddingBottom: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoText: { fontSize: 26, fontWeight: '900', letterSpacing: -1.5 },
  greetingActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { width: 42, height: 42, borderRadius: 100, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  sectionLabel: { paddingTop: 16, paddingBottom: 6 },
  doneCta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  captureWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50 },
  folderBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 100, borderWidth: 1, maxWidth: 120 },
  // AI Banner
  aiBanner: { marginHorizontal: 20, marginTop: 10, marginBottom: 14, padding: 14, borderRadius: radii.lg, borderWidth: 1, gap: 10, overflow: 'hidden', position: 'relative' },
  aiBannerGlow: { position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: 50, opacity: 0.08 },
  aiBannerText: { fontSize: 13, fontWeight: '600', lineHeight: 18, letterSpacing: -0.1 },
  aiBannerIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  aiExpanded: { borderTopWidth: 1, paddingTop: 10, marginTop: 8, gap: 8 },
  aiNoteCard: { padding: 12, borderRadius: radii.md, borderWidth: 1 },
  aiPriBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.full, borderWidth: 1 },
  // Multi-select
  multiBar: { position: 'absolute', bottom: 100, left: 12, right: 12, borderRadius: radii.lg, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 60 },
  multiBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.full },
  selectBox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
