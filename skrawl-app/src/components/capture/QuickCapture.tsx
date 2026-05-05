import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { FadeIn, SlideInDown, Easing } from 'react-native-reanimated';
import { useThemeColors, colors, typography, spacing, radii } from '@/src/theme';
import { useUIStore } from '@/src/store/ui-store';
import { useNoteStore } from '@/src/store/note-store';
import { useFolderStore } from '@/src/store/folder-store';
import { useReminderStore } from '@/src/store/reminder-store';
import { useNudgeStore } from '@/src/store/nudge-store';
import { parseNaturalLanguage, suggestPriorityFromDueDate } from '@/src/services/nl-parser';
import type { NoteType, Context, Reminder } from '@/src/models';
import type { PriorityLevel, NoteColor } from '@/src/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenDetail: (noteId: string) => void;
}

const typeOptions: { value: NoteType; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { value: 'task', icon: 'checkmark-circle-outline', label: 'Task' },
  { value: 'list', icon: 'checkbox-outline', label: 'List' },
  { value: 'note', icon: 'document-text-outline', label: 'Note' },
];

const priorityConfig: { value: PriorityLevel; label: string; due: string; reminders: { label: string; hours: number }[] }[] = [
  { value: 0, label: 'P0', due: '< 2 days', reminders: [
    { label: '2 hours', hours: 2 }, { label: '12 hours', hours: 12 }, { label: '1 day', hours: 24 },
  ]},
  { value: 1, label: 'P1', due: '< 1 week', reminders: [
    { label: '1 day', hours: 24 }, { label: '3 days', hours: 72 }, { label: '5 days', hours: 120 },
  ]},
  { value: 2, label: 'P2', due: '< 2 weeks', reminders: [
    { label: '3 days', hours: 72 }, { label: '1 week', hours: 168 }, { label: '2 weeks', hours: 336 },
  ]},
];

export function QuickCapture({ visible, onClose, onOpenDetail }: Props) {
  const c = useThemeColors();
  const context = useUIStore((s) => s.context);
  const defaultMode = useUIStore((s) => s.defaultMode);
  const addNote = useNoteStore((s) => s.addNote);
  const addReminder = useReminderStore((s) => s.addReminder);
  const folders = useFolderStore((s) => s.folders);
  const vibeValue = useUIStore((s) => s.vibeValue);
  const onNoteCreated = useNudgeStore((s) => s.onNoteCreated);
  const [nlSuggestion, setNlSuggestion] = useState<ReturnType<typeof parseNaturalLanguage> | null>(null);

  const [title, setTitle] = useState('');
  const [noteType, setNoteType] = useState<NoteType>(defaultMode);
  const [priority, setPriority] = useState<PriorityLevel | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [selectedReminderHours, setSelectedReminderHours] = useState<number | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setNoteType(defaultMode);
      setPriority(null);
      setFolderId(null);
      setShowOptions(false);
      // Delay focus to let the panel animate in first
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleTitleChange = (text: string) => {
    setTitle(text);
    if (text.trim().length > 5) {
      const parsed = parseNaturalLanguage(text);
      setNlSuggestion(parsed);
      // Auto-apply priority: from NL keywords, or from due date
      if (priority === null) {
        if (parsed.priority !== null) {
          setPriority(parsed.priority);
        } else if (parsed.reminderDate) {
          setPriority(suggestPriorityFromDueDate(parsed.reminderDate));
        }
      }
    } else {
      setNlSuggestion(null);
    }
  };

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const parsed = nlSuggestion || parseNaturalLanguage(trimmed);
    const note = await addNote({
      title: parsed.title || trimmed,
      context,
      type: noteType,
      priority,
      folderId,
      recurrence: parsed.recurrence,
    });

    // Create reminder — from NL parsing or selected hours
    const reminderDate = parsed.reminderDate || (selectedReminderHours ? new Date(Date.now() + selectedReminderHours * 60 * 60 * 1000) : null);
    if (reminderDate) {
      await addReminder({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        noteId: note.id,
        remindAt: reminderDate.toISOString(),
        calendarEventId: null,
        status: 'pending',
        aiSuggested: !parsed.reminderDate,
        autoSet: false,
        createdAt: new Date().toISOString(),
        isDirty: true,
      });
    }

    setTitle('');
    setPriority(null);
    setFolderId(null);
    setShowOptions(false);
    setNlSuggestion(null);
    setSelectedReminderHours(null);
    onClose();
    onNoteCreated(vibeValue);
  };

  const handleOpenDetail = async () => {
    const trimmed = title.trim();
    const note = await addNote({
      title: trimmed || '',
      context,
      type: noteType,
      priority,
      folderId,
    });

    setTitle('');
    onClose();
    onOpenDetail(note.id);
  };

  if (!visible) return null;

  return (
    <Animated.View
      entering={SlideInDown.duration(250).easing(Easing.out(Easing.cubic))}
      style={[styles.container, { backgroundColor: c.bgElevated, borderColor: c.border }]}
    >
      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={[styles.input, typography.body, { color: c.text }]}
          placeholder="What's on your mind?"
          placeholderTextColor={c.textMuted}
          value={title}
          onChangeText={handleTitleChange}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          autoFocus={Platform.OS === 'web'}
        />
        <Pressable
          onPress={handleSubmit}
          style={[styles.submitBtn, { backgroundColor: title.trim() ? c.accent : c.bgCard }]}
          disabled={!title.trim()}
        >
          <Ionicons name="arrow-up" size={18} color={title.trim() ? '#fff' : c.textMuted} />
        </Pressable>
      </View>

      {/* Quick action chips */}
      <View style={styles.chipsRow}>
        {typeOptions.map((opt) => (
          <Pressable
            key={opt.value}
            style={[
              styles.chip,
              { borderColor: noteType === opt.value ? c.accent : c.border },
              noteType === opt.value && { backgroundColor: c.accentGlow },
            ]}
            onPress={async () => {
              setNoteType(opt.value);
              if (opt.value === 'list') {
                // Open detail with list type pre-set
                const note = await addNote({ title: title.trim() || '', context, type: 'list', priority, folderId });
                setTitle('');
                onClose();
                onOpenDetail(note.id);
              }
            }}
          >
            <Ionicons name={opt.icon} size={14} color={noteType === opt.value ? c.accent : c.textDim} />
            <Text style={[styles.chipText, { color: noteType === opt.value ? c.accent : c.textDim }]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}

        <View style={styles.chipDivider} />

        <Pressable
          style={[styles.chip, { borderColor: c.border }]}
          onPress={handleOpenDetail}
        >
          <Ionicons name="expand-outline" size={14} color={c.textDim} />
        </Pressable>
      </View>

      {/* Priority with due date + reminder suggestions */}
      <View style={{ gap: 6 }}>
        <View style={styles.optionRow}>
          {priorityConfig.map((opt) => {
            const priColor = colors.priority[opt.value];
            const selected = priority === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.priChip, { borderColor: selected ? priColor : c.border }, selected && { backgroundColor: `${priColor}22` }]}
                onPress={() => { setPriority(selected ? null : opt.value); setSelectedReminderHours(null); }}
              >
                <Text style={[styles.priText, { color: selected ? priColor : c.textDim }]}>{opt.label}</Text>
                <Text style={[{ fontSize: 9, color: selected ? priColor : c.textMuted }]}>{opt.due}</Text>
              </Pressable>
            );
          })}
        </View>
        {/* Reminder options based on selected priority */}
        {priority !== null && (
          <View style={styles.optionRow}>
            <Ionicons name="alarm-outline" size={12} color={c.textMuted} />
            {priorityConfig.find((p) => p.value === priority)?.reminders.map((r) => {
              const selected = selectedReminderHours === r.hours;
              return (
                <Pressable
                  key={r.hours}
                  style={[styles.reminderChip, { borderColor: selected ? c.accent : c.border }, selected && { backgroundColor: c.accentGlow }]}
                  onPress={() => setSelectedReminderHours(selected ? null : r.hours)}
                >
                  <Text style={[{ fontSize: 10, fontWeight: '600', color: selected ? c.accent : c.textDim }]}>{r.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* NL suggestion chips */}
      {nlSuggestion && (nlSuggestion.reminderDate || nlSuggestion.recurrence) && (
        <Animated.View entering={FadeIn.duration(150)} style={styles.nlRow}>
          {nlSuggestion.reminderDate && (
            <View style={[styles.nlChip, { backgroundColor: c.accentGlow, borderColor: c.accent }]}>
              <Ionicons name="alarm-outline" size={12} color={c.accent} />
              <Text style={[{ fontSize: 11, fontWeight: '600', color: c.accent }]}>
                {nlSuggestion.reminderDate.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
              </Text>
            </View>
          )}
          {nlSuggestion.recurrence && (
            <View style={[styles.nlChip, { backgroundColor: `${c.accent2}20`, borderColor: c.accent2 }]}>
              <Ionicons name="repeat-outline" size={12} color={c.accent2} />
              <Text style={[{ fontSize: 11, fontWeight: '600', color: c.accent2 }]}>
                {nlSuggestion.recurrence}
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Folder options */}
      {showOptions && (
        <Animated.View entering={FadeIn.duration(150)} style={styles.optionsSection}>
          {folders.length > 0 && (
            <View style={styles.optionGroup}>
              <Text style={[typography.tiny, { color: c.textMuted, marginBottom: 6 }]}>FOLDER</Text>
              <View style={styles.optionRow}>
                {folders.map((f) => {
                  const selected = folderId === f.id;
                  return (
                    <Pressable
                      key={f.id}
                      style={[
                        styles.folderChip,
                        { borderColor: selected ? c.accent : c.border },
                        selected && { backgroundColor: c.accentGlow },
                      ]}
                      onPress={() => setFolderId(selected ? null : f.id)}
                    >
                      {f.color && <View style={[styles.folderDot, { backgroundColor: f.color }]} />}
                      <Text style={[styles.chipText, { color: selected ? c.accent : c.textDim }]} numberOfLines={1}>
                        {f.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  submitBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 2,
  },
  optionsSection: {
    gap: 12,
    paddingTop: 4,
  },
  optionGroup: {},
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  priChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  priText: {
    fontSize: 12,
    fontWeight: '800',
  },
  folderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  folderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reminderChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  nlRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  nlChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
  },
});
