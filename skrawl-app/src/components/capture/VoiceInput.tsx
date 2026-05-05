import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors, typography, spacing, radii } from '@/src/theme';
import { useNoteStore } from '@/src/store/note-store';
import { useReminderStore } from '@/src/store/reminder-store';
import { useUIStore } from '@/src/store/ui-store';
import { parseNaturalLanguage, suggestReminderForPriority, suggestPriorityFromDueDate } from '@/src/services/nl-parser';
import type { Reminder } from '@/src/models';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated?: (noteId: string) => void;
}

export function VoiceInput({ visible, onClose, onCreated }: Props) {
  const c = useThemeColors();
  const context = useUIStore((s) => s.context);
  const addNote = useNoteStore((s) => s.addNote);
  const addReminder = useReminderStore((s) => s.addReminder);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(true);
  const [parsedPreview, setParsedPreview] = useState<ReturnType<typeof parseNaturalLanguage> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Waveform animation
  const wave1 = useSharedValue(0.3);
  const wave2 = useSharedValue(0.5);
  const wave3 = useSharedValue(0.7);
  const wave4 = useSharedValue(0.4);
  const wave5 = useSharedValue(0.6);

  useEffect(() => {
    if (isListening) {
      wave1.value = withRepeat(withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }), -1, true);
      wave2.value = withRepeat(withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }), -1, true);
      wave3.value = withRepeat(withTiming(1, { duration: 350, easing: Easing.inOut(Easing.ease) }), -1, true);
      wave4.value = withRepeat(withTiming(1, { duration: 450, easing: Easing.inOut(Easing.ease) }), -1, true);
      wave5.value = withRepeat(withTiming(1, { duration: 380, easing: Easing.inOut(Easing.ease) }), -1, true);
    }
  }, [isListening]);

  useEffect(() => {
    if (visible) {
      setTranscript('');
      setIsListening(true);
      setParsedPreview(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Don't auto-focus — let user tap the input to open keyboard
    }
  }, [visible]);

  const handleTextChange = (text: string) => {
    setTranscript(text);
    if (text.trim().length > 2) {
      const parsed = parseNaturalLanguage(text);
      setParsedPreview(parsed);
    } else {
      setParsedPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) return;
    const parsed = parseNaturalLanguage(transcript);

    // Auto-suggest priority from due date if none set explicitly
    let notePriority = parsed.priority;
    if (notePriority === null && parsed.reminderDate) {
      notePriority = suggestPriorityFromDueDate(parsed.reminderDate);
    }

    const note = await addNote({
      title: parsed.title,
      context,
      type: parsed.type,
      priority: notePriority,
      recurrence: parsed.recurrence,
    });

    // Auto-set reminder if parsed or if high priority
    const reminderDate = parsed.reminderDate || suggestReminderForPriority(parsed.priority);
    if (reminderDate) {
      const reminder: Reminder = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        noteId: note.id,
        remindAt: reminderDate.toISOString(),
        calendarEventId: null,
        status: 'pending',
        aiSuggested: !parsed.reminderDate,
        autoSet: !parsed.reminderDate,
        createdAt: new Date().toISOString(),
        isDirty: true,
      };
      await addReminder(reminder);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCreated?.(note.id);
    onClose();
  };

  const WaveBar = ({ value }: { value: { value: number }; delay?: number }) => {
    const animStyle = useAnimatedStyle(() => ({
      height: 8 + value.value * 32,
    }));
    return (
      <Animated.View style={[styles.waveBar, { backgroundColor: c.accent }, animStyle]} />
    );
  };

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardWrap}
      keyboardVerticalOffset={0}
    >
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[styles.container, { backgroundColor: c.bgElevated, borderColor: c.border }]}
    >
      {/* Waveform */}
      {isListening && (
        <View style={styles.waveContainer}>
          <WaveBar value={wave1} delay={0} />
          <WaveBar value={wave2} delay={100} />
          <WaveBar value={wave3} delay={200} />
          <WaveBar value={wave4} delay={300} />
          <WaveBar value={wave5} delay={400} />
          <WaveBar value={wave3} delay={500} />
          <WaveBar value={wave1} delay={600} />
        </View>
      )}

      {/* Transcript input (simulated voice — user types, NL parser processes) */}
      <View style={styles.inputSection}>
        <Ionicons name="mic" size={20} color={c.accent} />
        <TextInput
          ref={inputRef}
          style={[styles.input, typography.body, { color: c.text }]}
          placeholder="Speak or type naturally..."
          placeholderTextColor={c.textMuted}
          value={transcript}
          onChangeText={handleTextChange}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          multiline={false}
        />
      </View>

      {/* NL Parse preview */}
      {parsedPreview && (
        <Animated.View entering={FadeIn.duration(150)} style={[styles.parsePreview, { borderColor: c.border }]}>
          <View style={styles.parseRow}>
            <Ionicons name="text-outline" size={14} color={c.textDim} />
            <Text style={[typography.caption, { color: c.text, flex: 1 }]} numberOfLines={1}>
              {parsedPreview.title}
            </Text>
          </View>
          {parsedPreview.reminderDate && (
            <View style={styles.parseRow}>
              <Ionicons name="alarm-outline" size={14} color={c.accent3} />
              <Text style={[typography.caption, { color: c.accent3 }]}>
                {parsedPreview.reminderDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              </Text>
            </View>
          )}
          {parsedPreview.priority !== null && (
            <View style={styles.parseRow}>
              <Ionicons name="flag-outline" size={14} color={c.accent4} />
              <Text style={[typography.caption, { color: c.accent4 }]}>Priority P{parsedPreview.priority}</Text>
            </View>
          )}
          {parsedPreview.recurrence && (
            <View style={styles.parseRow}>
              <Ionicons name="repeat-outline" size={14} color={c.accent2} />
              <Text style={[typography.caption, { color: c.accent2 }]}>{parsedPreview.recurrence}</Text>
            </View>
          )}
          {parsedPreview.tags.length > 0 && (
            <View style={styles.parseRow}>
              <Ionicons name="pricetag-outline" size={14} color={c.textDim} />
              <Text style={[typography.caption, { color: c.textDim }]}>
                {parsedPreview.tags.map((t) => `#${t}`).join(' ')}
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable onPress={onClose} style={[styles.cancelBtn, { borderColor: c.border }]}>
          <Text style={[typography.label, { color: c.textDim }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          style={[styles.createBtn, { backgroundColor: transcript.trim() ? c.accent : c.bgCard }]}
          disabled={!transcript.trim()}
        >
          <Ionicons name="add" size={18} color={transcript.trim() ? '#fff' : c.textMuted} />
          <Text style={[typography.label, { color: transcript.trim() ? '#fff' : c.textMuted }]}>Create</Text>
        </Pressable>
      </View>
    </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  container: {
    marginBottom: 24,
    marginHorizontal: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    zIndex: 50,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 44,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 8,
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  parsePreview: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 6,
  },
  parseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
});
