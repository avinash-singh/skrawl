import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useThemeColors, typography, spacing, radii } from '@/src/theme';
import { useFocusStore } from '@/src/store/focus-store';
import { useUIStore } from '@/src/store/ui-store';
import Ionicons from '@expo/vector-icons/Ionicons';

const PRESETS = [
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '25 min', minutes: 25 },
  { label: '50 min', minutes: 50 },
];

export default function FocusScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const context = useUIStore((s) => s.context);
  const { activeSession, isRunning, remainingSeconds, startSession, tick, completeSession, cancelSession } = useFocusStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => tick(), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (remainingSeconds === 0 && activeSession) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [remainingSeconds]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = activeSession
    ? 1 - remainingSeconds / activeSession.durationPlanned
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={c.textDim} />
        </Pressable>
        <Text style={[typography.heading, { color: c.text }]}>Focus Mode</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Timer circle */}
        <View style={[styles.timerCircle, { borderColor: isRunning ? c.accent : c.border }]}>
          <Text style={[styles.timerText, { color: c.text }]}>
            {isRunning ? formatTime(remainingSeconds) : '00:00'}
          </Text>
          {isRunning && (
            <Text style={[typography.caption, { color: c.textMuted }]}>
              {Math.round(progress * 100)}% complete
            </Text>
          )}
        </View>

        {/* Preset buttons */}
        {!isRunning && (
          <View style={styles.presets}>
            <Text style={[typography.sectionHeader, { color: c.textMuted, marginBottom: 12 }]}>
              DURATION
            </Text>
            <View style={styles.presetRow}>
              {PRESETS.map((p) => (
                <Pressable
                  key={p.minutes}
                  style={[styles.presetBtn, { borderColor: c.border, backgroundColor: c.bgCard }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    startSession('', p.minutes, context);
                  }}
                >
                  <Text style={[typography.label, { color: c.text }]}>{p.label}</Text>
                  <Text style={[typography.tiny, { color: c.textMuted }]}>
                    {p.minutes === 25 ? 'Pomodoro' : p.minutes === 50 ? 'Deep work' : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Active session controls */}
        {isRunning && (
          <View style={styles.controls}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                completeSession();
              }}
              style={[styles.controlBtn, { backgroundColor: c.accent }]}
            >
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={[typography.label, { color: '#fff' }]}>Complete</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                cancelSession();
              }}
              style={[styles.controlBtn, { borderColor: c.border, borderWidth: 1 }]}
            >
              <Ionicons name="close" size={24} color={c.textDim} />
              <Text style={[typography.label, { color: c.textDim }]}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {/* Tips */}
        {!isRunning && (
          <View style={[styles.tipCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Ionicons name="bulb-outline" size={18} color={c.accent4} />
            <Text style={[typography.caption, { color: c.textDim, flex: 1 }]}>
              Put your phone face down and focus on one thing. You'll be notified when time is up.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 40,
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  presets: {
    width: '100%',
    alignItems: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 2,
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radii.full,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    width: '100%',
  },
});
