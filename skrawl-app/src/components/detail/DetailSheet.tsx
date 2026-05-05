import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform, Share, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useThemeColors, colors, typography, spacing, radii } from '@/src/theme';
import { useNoteStore } from '@/src/store/note-store';
import { useFolderStore } from '@/src/store/folder-store';
import type { Note, ChecklistItem, NoteType } from '@/src/models';
import type { PriorityLevel } from '@/src/theme/colors';
import { ImageGrid } from './ImageGrid';
import { useReminderStore } from '@/src/store/reminder-store';
import { useNudgeStore } from '@/src/store/nudge-store';
import { useUIStore } from '@/src/store/ui-store';
import { autoTitle, suggestReminderForPriority, suggestPriorityFromDueDate } from '@/src/services/nl-parser';
import { isConfigured as isAiConfigured, processVoiceInput } from '@/src/services/ai-service';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  noteId: string | null;
  onDismiss: () => void;
}

const priorityOptions: { value: PriorityLevel; label: string }[] = [
  { value: 0, label: 'P0' },
  { value: 1, label: 'P1' },
  { value: 2, label: 'P2' },
];

export function DetailSheet({ noteId, onDismiss }: Props) {
  const c = useThemeColors();
  const getNoteById = useNoteStore((s) => s.getNoteById);
  const updateNote = useNoteStore((s) => s.updateNote);
  const folders = useFolderStore((s) => s.folders);
  const vibeValue = useUIStore((s) => s.vibeValue);
  const onNoteSaved = useNudgeStore((s) => s.onNoteSaved);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['70%', '95%'], []);

  // Local editable state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('task');
  const [priority, setPriority] = useState<PriorityLevel | null>(null);
  const [color, setColor] = useState('default' as any);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [micText, setMicText] = useState('');
  const noteRef = useRef<Note | null>(null);

  // Populate on open
  useEffect(() => {
    if (noteId) {
      const note = getNoteById(noteId);
      if (note) {
        noteRef.current = note;
        setTitle(note.title);
        setBody(note.body);
        setNoteType(note.type);
        setPriority(note.priority);
        setColor(note.color);
        setFolderId(note.folderId);
        setItems([...note.items]);
        setNoteImages([...note.images]);
        setIsPinned(note.isPinned);
        setNewItemText('');
        setShowImagePicker(false);
        bottomSheetRef.current?.snapToIndex(0);
      }
    }
  }, [noteId]);

  // Auto-save on dismiss
  const handleDismiss = useCallback(() => {
    const note = noteRef.current;
    if (note) {
      const updated: Note = {
        ...note,
        title,
        body,
        type: noteType,
        priority,
        color,
        folderId,
        items,
        images: noteImages,
        isPinned,
        updatedAt: new Date().toISOString(),
        isDirty: true,
      };
      updateNote(updated);
      onNoteSaved(vibeValue);
    }
    noteRef.current = null;
    onDismiss();
  }, [title, body, noteType, priority, color, folderId, items, noteImages, isPinned, onDismiss, updateNote, vibeValue, onNoteSaved]);

  // Checklist helpers
  const toggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, isDone: !item.isDone } : item))
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    const text = newItemText.trim();
    if (!text) return;
    const item: ChecklistItem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text,
      isDone: false,
      sort: items.length,
    };
    setItems((prev) => [...prev, item]);
    setNewItemText('');
  };

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />,
    []
  );

  if (!noteId) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onClose={handleDismiss}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: c.bgElevated }}
      handleIndicatorStyle={{ backgroundColor: c.textMuted, width: 40 }}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      enableDynamicSizing={false}
    >
      <BottomSheetScrollView style={styles.content} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        {/* Title with auto-suggest ghost text */}
        <View>
          <TextInput
            style={[typography.heading, styles.titleInput, { color: c.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={c.textMuted}
            multiline
          />
          {!title && body && body.length > 5 && (
            <Pressable onPress={() => {
              const suggested = autoTitle(body);
              if (suggested) setTitle(suggested);
            }}>
              <Text style={[typography.caption, { color: c.textMuted, paddingHorizontal: 4, marginTop: -6, marginBottom: 4, fontStyle: 'italic' }]} numberOfLines={1}>
                Suggestion: {autoTitle(body) || ''}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Type toggle */}
        <View style={styles.typeRow}>
          {(['task', 'list', 'note'] as NoteType[]).map((t) => {
            const icons: Record<NoteType, keyof typeof Ionicons.glyphMap> = {
              task: 'checkmark-circle-outline',
              list: 'checkbox-outline',
              note: 'document-text-outline',
            };
            const selected = noteType === t;
            return (
              <Pressable
                key={t}
                style={[styles.typeChip, { borderColor: selected ? c.accent : c.border }, selected && { backgroundColor: c.accentGlow }]}
                onPress={() => setNoteType(t)}
              >
                <Ionicons name={icons[t]} size={14} color={selected ? c.accent : c.textDim} />
                <Text style={[styles.typeLabel, { color: selected ? c.accent : c.textDim }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Priority buttons */}
        <View style={styles.section}>
          <Text style={[typography.tiny, { color: c.textMuted, marginBottom: 8 }]}>PRIORITY</Text>
          <View style={styles.priorityRow}>
            {priorityOptions.map((opt) => {
              const priColor = colors.priority[opt.value];
              const selected = priority === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.priBtn,
                    { borderColor: selected ? priColor : c.border },
                    selected && { backgroundColor: `${priColor}22` },
                  ]}
                  onPress={() => setPriority(selected ? null : opt.value)}
                >
                  <Text style={[styles.priBtnText, { color: selected ? priColor : c.textDim }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Folder picker */}
        {folders.length > 0 && (
          <View style={styles.section}>
            <Text style={[typography.tiny, { color: c.textMuted, marginBottom: 8 }]}>FOLDER</Text>
            <View style={styles.folderRow}>
              <Pressable
                style={[styles.folderChip, { borderColor: !folderId ? c.accent : c.border }, !folderId && { backgroundColor: c.accentGlow }]}
                onPress={() => setFolderId(null)}
              >
                <Text style={[styles.folderLabel, { color: !folderId ? c.accent : c.textDim }]}>None</Text>
              </Pressable>
              {folders.map((f) => {
                const selected = folderId === f.id;
                return (
                  <Pressable
                    key={f.id}
                    style={[styles.folderChip, { borderColor: selected ? c.accent : c.border }, selected && { backgroundColor: c.accentGlow }]}
                    onPress={() => setFolderId(f.id)}
                  >
                    {f.color && <View style={[styles.folderDot, { backgroundColor: f.color }]} />}
                    <Text style={[styles.folderLabel, { color: selected ? c.accent : c.textDim }]} numberOfLines={1}>
                      {f.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick actions row: Pin + Image + Export */}
        <View style={[styles.quickActionsRow, { marginBottom: 12 }]}>
          <Pressable
            style={[styles.quickActionBtn, { borderColor: isPinned ? c.accent : c.border }, isPinned && { backgroundColor: c.accentGlow }]}
            onPress={() => setIsPinned(!isPinned)}
          >
            <Ionicons name={isPinned ? 'pin' : 'pin-outline'} size={14} color={isPinned ? c.accent : c.textDim} />
            <Text style={[{ fontSize: 12, fontWeight: '600', color: isPinned ? c.accent : c.textDim }]}>{isPinned ? 'Pinned' : 'Pin'}</Text>
          </Pressable>
          <Pressable
            style={[styles.quickActionBtn, { borderColor: c.border }]}
            onPress={() => setShowImagePicker(!showImagePicker)}
          >
            <Ionicons name="camera-outline" size={14} color={c.textDim} />
            <Text style={[{ fontSize: 12, fontWeight: '600', color: c.textDim }]}>
              {noteImages.length > 0 ? `${noteImages.length} image${noteImages.length > 1 ? 's' : ''}` : 'Image'}
            </Text>
          </Pressable>
        </View>

        {/* Mic input — type what you'd say, AI processes it */}
        {micActive && (
          <View style={[styles.micSection, { backgroundColor: c.bgInput, borderColor: c.accent }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="mic" size={16} color={c.accent} />
              <Text style={[{ fontSize: 13, fontWeight: '600', color: c.text }]}>Voice to Note</Text>
              <Text style={[{ fontSize: 11, color: c.textDim }]}>— speak or type, AI updates the note</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.micInput, { color: c.text, borderColor: c.border, backgroundColor: c.bgCard, flex: 1 }]}
                value={micText}
                onChangeText={setMicText}
                placeholder="e.g. Add 'buy milk' to the list and set priority to high"
                placeholderTextColor={c.textMuted}
                multiline
                autoFocus
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Pressable onPress={() => { setMicActive(false); setMicText(''); }}>
                <Text style={[{ fontSize: 13, fontWeight: '600', color: c.textDim }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  const input = micText.trim();
                  if (!input) return;

                  if (isAiConfigured()) {
                    // Use OpenAI to intelligently process the command
                    const updates = await processVoiceInput(input, { title, body, priority }, vibeValue);
                    if (updates) {
                      if (updates.title !== undefined) setTitle(updates.title);
                      if (updates.body !== undefined) setBody(updates.body);
                      if (updates.priority !== undefined) setPriority(updates.priority as any);
                    } else {
                      // AI failed — fall back to simple append
                      setBody((prev) => prev ? `${prev}\n${input}` : input);
                    }
                  } else {
                    // No AI key — use simple pattern matching
                    if (input.toLowerCase().startsWith('title:') || input.toLowerCase().startsWith('set title')) {
                      setTitle(input.replace(/^(title:|set title)\s*/i, ''));
                    } else if (input.toLowerCase().startsWith('priority') || input.match(/^p[0-3]/i)) {
                      const match = input.match(/[0-3]/);
                      if (match) setPriority(parseInt(match[0], 10) as any);
                    } else {
                      setBody((prev) => prev ? `${prev}\n${input}` : input);
                    }
                  }
                  setMicText('');
                  setMicActive(false);
                }}
                style={[styles.micSubmitBtn, { backgroundColor: c.accent }]}
              >
                <Ionicons name="sparkles" size={14} color="#fff" />
                <Text style={[{ fontSize: 13, fontWeight: '600', color: '#fff' }]}>Process</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Image attachments — collapsed by default */}
        {showImagePicker && <ImageGrid images={noteImages} onImagesChange={setNoteImages} />}

        {/* Reminder */}
        <ReminderBar noteId={noteId} priority={priority} onPriorityChange={setPriority} />

        {/* Body (note/task) */}
        {(noteType === 'note' || noteType === 'task') && (
          <View style={styles.section}>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[typography.body, styles.bodyInput, { color: c.text, borderColor: c.border, paddingRight: 44 }]}
                value={body}
                onChangeText={(text) => {
                  setBody(text);
                  if (text.endsWith('/')) setShowSlashMenu(true);
                  else if (showSlashMenu && !text.includes('/')) setShowSlashMenu(false);
                }}
                placeholder="Add notes... (type / for commands)"
                placeholderTextColor={c.textMuted}
                multiline
                textAlignVertical="top"
              />
              {/* Floating mic button */}
              <Pressable
                style={[styles.floatingMic, { backgroundColor: micActive ? c.accent : c.bgCard, borderColor: micActive ? c.accent : c.border }]}
                onPress={() => setMicActive(!micActive)}
              >
                <Ionicons name="mic" size={16} color={micActive ? '#fff' : c.textDim} />
              </Pressable>
            </View>
            {/* Slash command menu */}
            {showSlashMenu && (
              <View style={[styles.slashMenu, { backgroundColor: c.bgElevated, borderColor: c.border }]}>
                {[
                  { icon: 'text-outline' as const, label: 'Heading', color: c.accent, action: () => { setBody(body.replace(/\/$/, '# ')); setShowSlashMenu(false); } },
                  { icon: 'checkbox-outline' as const, label: 'Checklist', color: c.accent3, action: () => { setNoteType('list'); setBody(body.replace(/\/$/, '')); setShowSlashMenu(false); } },
                  { icon: 'alarm-outline' as const, label: 'Reminder', color: c.accent2, action: () => { setBody(body.replace(/\/$/, '')); setShowSlashMenu(false); } },
                  { icon: 'folder-outline' as const, label: 'Move to Folder', color: '#6AB4FF', action: () => { setBody(body.replace(/\/$/, '')); setShowSlashMenu(false); } },
                ].map((cmd) => (
                  <Pressable key={cmd.label} style={styles.slashItem} onPress={cmd.action}>
                    <View style={[styles.slashIcon, { backgroundColor: cmd.color }]}>
                      <Ionicons name={cmd.icon} size={14} color="#fff" />
                    </View>
                    <Text style={[{ fontSize: 14, fontWeight: '500', color: c.text }]}>{cmd.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Checklist editor (list type) */}
        {noteType === 'list' && (
          <View style={styles.section}>
            <Text style={[typography.tiny, { color: c.textMuted, marginBottom: 8 }]}>CHECKLIST</Text>
            {items.map((item, i) => (
              <View key={item.id} style={styles.checklistRow}>
                <Pressable
                  style={[styles.checkBox, item.isDone ? styles.checkBoxDone : { borderColor: c.border2 }]}
                  onPress={() => toggleItem(i)}
                >
                  {item.isDone && <Ionicons name="checkmark" size={12} color="#fff" />}
                </Pressable>
                <Text
                  style={[
                    typography.body,
                    { flex: 1, color: item.isDone ? c.textMuted : c.text },
                    item.isDone && styles.strikethrough,
                  ]}
                >
                  {item.text}
                </Text>
                <Pressable onPress={() => removeItem(i)} hitSlop={8}>
                  <Ionicons name="close" size={16} color={c.textMuted} />
                </Pressable>
              </View>
            ))}
            <View style={styles.addItemRow}>
              <Ionicons name="add-circle-outline" size={18} color={c.accent} />
              <BottomSheetTextInput
                style={[typography.body, { flex: 1, color: c.text }]}
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder="Add item..."
                placeholderTextColor={c.textMuted}
                onSubmitEditing={addItem}
                returnKeyType="done"
                blurOnSubmit={false}
              />
            </View>
          </View>
        )}

        {/* Export / Share */}
        <Pressable
          style={[styles.exportBtn, { borderColor: c.border }]}
          onPress={async () => {
            let text = title ? `# ${title}\n\n` : '';
            if (noteType === 'list') {
              text += items.map((i) => `${i.isDone ? '[x]' : '[ ]'} ${i.text}`).join('\n');
            } else if (body) {
              text += body;
            }
            if (priority !== null) text += `\n\nPriority: P${priority}`;
            await Share.share({ message: text, title: title || 'Skrawl Note' });
          }}
        >
          <Ionicons name="share-outline" size={16} color={c.textDim} />
          <Text style={[typography.caption, { color: c.textDim }]}>Export / Share</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

function ReminderBar({ noteId, priority, onPriorityChange }: { noteId: string | null; priority: PriorityLevel | null; onPriorityChange: (p: PriorityLevel) => void }) {
  const c = useThemeColors();
  const reminders = useReminderStore((s) => s.reminders);
  const addReminder = useReminderStore((s) => s.addReminder);
  const dismissReminder = useReminderStore((s) => s.dismissReminder);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [lastTapped, setLastTapped] = useState<string | null>(null);

  const noteReminders = noteId ? reminders.filter((r) => r.noteId === noteId) : [];

  // Presets — relative to existing reminder date or priority
  const baseDate = noteReminders.length > 0 ? new Date(noteReminders[0].remindAt) : new Date();
  const presets = priority === 0 ? [
    { label: '+2h', getDate: () => new Date(baseDate.getTime() + 2 * 60 * 60 * 1000) },
    { label: '+12h', getDate: () => new Date(baseDate.getTime() + 12 * 60 * 60 * 1000) },
    { label: '+1 day', getDate: () => new Date(baseDate.getTime() + 24 * 60 * 60 * 1000) },
  ] : priority === 1 ? [
    { label: '+1 day', getDate: () => new Date(baseDate.getTime() + 24 * 60 * 60 * 1000) },
    { label: '+3 days', getDate: () => new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000) },
    { label: '+5 days', getDate: () => new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000) },
  ] : [
    { label: 'Today 5PM', getDate: () => { const d = new Date(); d.setHours(17, 0, 0, 0); return d; } },
    { label: 'Tomorrow', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; } },
    { label: 'Next week', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(9, 0, 0, 0); return d; } },
  ];

  const handleSetReminder = async (date: Date) => {
    if (!noteId) return;
    for (const r of noteReminders) {
      await dismissReminder(r.id);
    }
    await addReminder({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      noteId,
      remindAt: date.toISOString(),
      calendarEventId: null,
      status: 'pending',
      aiSuggested: false,
      autoSet: false,
      createdAt: new Date().toISOString(),
      isDirty: true,
    });
    setShowPicker(false);
    const suggestedPri = suggestPriorityFromDueDate(date);
    if (priority === null || suggestedPri < priority) {
      onPriorityChange(suggestedPri);
    }
  };

  const openPicker = (initialDate?: Date) => {
    setPickerDate(initialDate || new Date());
    setShowPicker(true);
  };

  return (
    <View style={styles.section}>
      <Text style={[typography.tiny, { color: c.textMuted, marginBottom: 8 }]}>REMINDER</Text>

      {/* Active reminder — tappable to edit */}
      {noteReminders.length > 0 && (
        <Pressable
          style={[reminderStyles.activeBar, { borderColor: c.accent, backgroundColor: c.accentGlow, marginBottom: 8 }]}
          onPress={() => openPicker(new Date(noteReminders[0].remindAt))}
        >
          <Ionicons name="alarm" size={16} color={c.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[{ fontSize: 13, fontWeight: '600', color: c.text }]}>
              {new Date(noteReminders[0].remindAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={[{ fontSize: 10, color: c.textDim }]}>Tap to change</Text>
          </View>
          {noteReminders[0].aiSuggested && (
            <View style={[reminderStyles.aiChip, { backgroundColor: c.bgCard }]}>
              <Text style={[{ fontSize: 9, fontWeight: '700', color: c.accent }]}>AI</Text>
            </View>
          )}
          <Pressable onPress={() => dismissReminder(noteReminders[0].id)} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={c.textMuted} />
          </Pressable>
        </Pressable>
      )}

      {/* Preset buttons */}
      <View style={reminderStyles.presetRow}>
        {presets.map((p) => {
          const tapped = lastTapped === p.label;
          return (
            <Pressable
              key={p.label}
              style={[reminderStyles.presetBtn, { borderColor: tapped ? c.accent3 : c.border, backgroundColor: tapped ? `${c.accent3}20` : c.bgCard }]}
              onPress={() => {
                setLastTapped(p.label);
                setShowPicker(false);
                handleSetReminder(p.getDate());
                setTimeout(() => setLastTapped(null), 1500);
              }}
            >
              <Text style={[{ fontSize: 12, fontWeight: '500', color: tapped ? c.accent3 : c.textDim }]}>{p.label}</Text>
            </Pressable>
          );
        })}
        <Pressable
          style={[reminderStyles.presetBtn, { borderColor: showPicker ? c.accent : c.border, backgroundColor: showPicker ? c.accentGlow : c.bgCard }]}
          onPress={() => { setLastTapped(null); openPicker(); }}
        >
          <Ionicons name="calendar-outline" size={12} color={showPicker ? c.accent : c.textDim} />
          <Text style={[{ fontSize: 12, fontWeight: '500', color: showPicker ? c.accent : c.textDim }]}>Pick</Text>
        </Pressable>
      </View>

      {/* Native date/time picker — rendered as Modal overlay */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={reminderStyles.pickerOverlay}>
          <View style={[reminderStyles.pickerSheet, { backgroundColor: c.bgElevated }]}>
            <View style={reminderStyles.pickerHeader}>
              <Pressable onPress={() => setShowPicker(false)}>
                <Text style={[{ fontSize: 16, fontWeight: '600', color: c.textDim }]}>Cancel</Text>
              </Pressable>
              <Text style={[{ fontSize: 16, fontWeight: '700', color: c.text }]}>Set Reminder</Text>
              <Pressable onPress={() => handleSetReminder(pickerDate)}>
                <Text style={[{ fontSize: 16, fontWeight: '600', color: c.accent }]}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={pickerDate}
              mode="datetime"
              display="spinner"
              themeVariant="dark"
              minimumDate={new Date()}
              onChange={(_, date) => { if (date) setPickerDate(date); }}
              style={{ height: 200 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const reminderStyles = StyleSheet.create({
  activeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  aiChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
});

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  titleInput: {
    marginBottom: 12,
    paddingVertical: 4,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  priBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  folderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  folderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  folderLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  folderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bodyInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 12,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxDone: {
    borderWidth: 0,
    backgroundColor: '#7C6AFF',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  floatingMic: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micSection: {
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  micInput: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  micSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: radii.sm,
    marginTop: 8,
  },
  slashMenu: {
    borderWidth: 1,
    borderRadius: radii.md,
    marginTop: 6,
    overflow: 'hidden',
  },
  slashItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 11,
    paddingHorizontal: 14,
  },
  slashIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: radii.sm,
    marginBottom: 8,
  },
});
