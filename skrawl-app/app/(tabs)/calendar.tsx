import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useThemeColors, colors, typography, spacing, radii } from '@/src/theme';
import { useUIStore } from '@/src/store/ui-store';
import { useNoteStore } from '@/src/store/note-store';
import { useReminderStore } from '@/src/store/reminder-store';
import { ContextToggle } from '@/src/components/common/ContextToggle';
import { DetailSheet } from '@/src/components/detail/DetailSheet';
import Ionicons from '@expo/vector-icons/Ionicons';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const c = useThemeColors();
  const context = useUIStore((s) => s.context);
  const notes = useNoteStore((s) => s.notes);
  const { reminders, loadReminders } = useReminderStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [detailNoteId, setDetailNoteId] = useState<string | null>(null);
  const [calSort, setCalSort] = useState<'priority' | 'date'>('priority');

  useEffect(() => { loadReminders(); }, []);

  // Calendar month data
  const { year, month, daysInMonth, startDow, today } = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const dim = new Date(y, m + 1, 0).getDate();
    const sd = new Date(y, m, 1).getDay();
    const now = new Date();
    return {
      year: y, month: m, daysInMonth: dim, startDow: sd,
      today: now.getFullYear() === y && now.getMonth() === m ? now.getDate() : -1,
    };
  }, [selectedDate]);

  const monthName = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Reminders for selected date
  const selectedDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const dayReminders = reminders.filter((r) => r.remindAt.startsWith(selectedDayStr));

  // Days with reminders in this month
  const reminderDays = useMemo(() => {
    const days = new Set<number>();
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
    for (const r of reminders) {
      if (r.remindAt.startsWith(prefix)) {
        const day = parseInt(r.remindAt.substring(prefix.length, prefix.length + 2), 10);
        days.add(day);
      }
    }
    return days;
  }, [reminders, year, month]);

  // Due notes (P0/P1 without reminders)
  const urgentNotes = notes.filter((n) => !n.isDone && n.priority !== null && n.priority <= 1);

  const changeMonth = (delta: number) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + delta);
    setSelectedDate(d);
  };

  const selectDay = (day: number) => {
    const d = new Date(year, month, day);
    setSelectedDate(d);
  };

  // Build calendar grid
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.headerWrap}>
          <View style={styles.headerRow}>
            <Text style={[typography.heading, { color: c.text }]}>Calendar</Text>
            <ContextToggle />
          </View>
        </View>

        {/* Month navigation */}
        <View style={styles.monthRow}>
          <Pressable onPress={() => changeMonth(-1)} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={c.textDim} />
          </Pressable>
          <Text style={[typography.label, { color: c.text }]}>{monthName}</Text>
          <Pressable onPress={() => changeMonth(1)} hitSlop={8}>
            <Ionicons name="chevron-forward" size={20} color={c.textDim} />
          </Pressable>
        </View>

        {/* Day headers */}
        <View style={styles.weekRow}>
          {DAYS.map((d) => (
            <View key={d} style={styles.dayCell}>
              <Text style={[typography.tiny, { color: c.textMuted }]}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {calendarCells.map((day, i) => {
            const isToday = day === today;
            const isSelected = day === selectedDate.getDate();
            const hasReminder = day !== null && reminderDays.has(day);
            return (
              <View key={i} style={styles.dayCell}>
                {day ? (
                  <Pressable
                    style={[
                      styles.dayCellInner,
                      isSelected && { backgroundColor: c.accent },
                      isToday && !isSelected && { borderColor: c.accent, borderWidth: 1.5 },
                    ]}
                    onPress={() => selectDay(day)}
                  >
                    <Text style={[
                      styles.dayText,
                      { color: isSelected ? '#fff' : isToday ? c.accent : c.text },
                    ]}>
                      {day}
                    </Text>
                    {hasReminder && (
                      <View style={[styles.reminderDot, { backgroundColor: isSelected ? '#fff' : c.accent2 }]} />
                    )}
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Day detail */}
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={[typography.sectionHeader, { color: c.textMuted }]}>
              {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['priority', 'date'] as const).map((s) => (
                <Pressable
                  key={s}
                  style={[styles.sortBtn, { borderColor: calSort === s ? c.accent : c.border }, calSort === s && { backgroundColor: c.accentGlow }]}
                  onPress={() => setCalSort(s)}
                >
                  <Ionicons name={s === 'priority' ? 'flag-outline' : 'time-outline'} size={11} color={calSort === s ? c.accent : c.textDim} />
                  <Text style={[{ fontSize: 11, fontWeight: '600', color: calSort === s ? c.accent : c.textDim }]}>
                    {s === 'priority' ? 'Priority' : 'Date'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {dayReminders.length > 0 ? (
            dayReminders.map((r) => {
              const note = notes.find((n) => n.id === r.noteId);
              return (
                <Pressable
                  key={r.id}
                  style={[styles.reminderCard, { backgroundColor: c.bgCard, borderColor: c.border }]}
                  onPress={() => note && setDetailNoteId(note.id)}
                >
                  <Ionicons name="alarm" size={16} color={c.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.label, { color: c.text }]}>{note?.title || 'Untitled'}</Text>
                    <Text style={[typography.tiny, { color: c.textMuted }]}>
                      {new Date(r.remindAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      {r.aiSuggested ? ' · AI suggested' : ''}
                    </Text>
                  </View>
                  {note?.priority !== null && note?.priority !== undefined && (
                    <View style={[styles.priBadge, { backgroundColor: `${colors.priority[note.priority]}22` }]}>
                      <Text style={[{ fontSize: 10, fontWeight: '800', color: colors.priority[note.priority] }]}>P{note.priority}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyDay}>
              <Ionicons name="calendar-outline" size={32} color={c.textMuted} />
              <Text style={[typography.caption, { color: c.textMuted, marginTop: 8 }]}>No reminders for this day</Text>
            </View>
          )}

          {/* Urgent items without reminders */}
          {urgentNotes.length > 0 && (
            <>
              <Text style={[typography.sectionHeader, { color: c.textMuted, marginTop: 20, marginBottom: 10 }]}>
                NEEDS ATTENTION
              </Text>
              {urgentNotes.slice(0, 5).map((n) => (
                <Pressable
                  key={n.id}
                  style={[styles.reminderCard, { backgroundColor: c.bgCard, borderColor: c.border }]}
                  onPress={() => setDetailNoteId(n.id)}
                >
                  <Ionicons name="flag" size={16} color={colors.priority[n.priority!]} />
                  <Text style={[typography.label, { color: c.text, flex: 1 }]} numberOfLines={1}>{n.title}</Text>
                  <View style={[styles.priBadge, { backgroundColor: `${colors.priority[n.priority!]}22` }]}>
                    <Text style={[{ fontSize: 10, fontWeight: '800', color: colors.priority[n.priority!] }]}>P{n.priority}</Text>
                  </View>
                </Pressable>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      <DetailSheet noteId={detailNoteId} onDismiss={() => setDetailNoteId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: { paddingTop: 60, paddingHorizontal: spacing.xl, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  reminderDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 1,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: 6,
  },
  priBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
});
