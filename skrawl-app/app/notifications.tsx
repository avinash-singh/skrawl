import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors, colors, typography, spacing, radii } from '@/src/theme';
import { useReminderStore } from '@/src/store/reminder-store';
import { useNoteStore } from '@/src/store/note-store';
import { useGoalStore } from '@/src/store/goal-store';
import Ionicons from '@expo/vector-icons/Ionicons';

interface NotifItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

export default function NotificationsScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const reminders = useReminderStore((s) => s.reminders);
  const notes = useNoteStore((s) => s.notes);
  const goals = useGoalStore((s) => s.goals);

  const notifications = useMemo<NotifItem[]>(() => {
    const items: NotifItem[] = [];

    // Reminders as notifications
    for (const r of reminders) {
      const note = notes.find((n) => n.id === r.noteId);
      const date = new Date(r.remindAt);
      items.push({
        id: `r-${r.id}`,
        icon: 'alarm',
        iconBg: '#7C6AFF',
        title: `Reminder: ${note?.title || 'Untitled'}`,
        description: r.aiSuggested ? 'AI suggested this reminder' : 'Set by you',
        time: date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }),
        unread: new Date(r.remindAt) > new Date(Date.now() - 24 * 60 * 60 * 1000),
      });
    }

    // Goal completions
    for (const g of goals.filter((g) => g.current >= g.target)) {
      items.push({
        id: `g-${g.id}`,
        icon: 'trophy',
        iconBg: '#6AFFCB',
        title: `Goal completed: ${g.name}`,
        description: `${g.current}/${g.target} ${g.unit} — streak: ${g.streak}`,
        time: 'Today',
        unread: false,
      });
    }

    // P0 items as urgent notifications
    for (const n of notes.filter((n) => !n.isDone && n.priority === 0)) {
      items.push({
        id: `u-${n.id}`,
        icon: 'flag',
        iconBg: '#FF5A5A',
        title: `Urgent: ${n.title}`,
        description: 'P0 priority — needs attention',
        time: new Date(n.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        unread: true,
      });
    }

    return items;
  }, [reminders, notes, goals]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={c.accent} />
          <Text style={{ color: c.accent, fontSize: 15, fontWeight: '500' }}>Back</Text>
        </Pressable>
        <Text style={[typography.label, { color: c.text, flex: 1, textAlign: 'center' }]}>Notifications</Text>
        <View style={{ width: 60 }} />
      </View>

      {unreadCount > 0 && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <Text style={[typography.caption, { color: c.accent }]}>{unreadCount} new</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color={c.textMuted} />
            <Text style={[typography.label, { color: c.textMuted, marginTop: 12 }]}>No notifications</Text>
            <Text style={[typography.caption, { color: c.textMuted, marginTop: 4 }]}>You're all caught up!</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {notifications.map((notif) => (
              <View
                key={notif.id}
                style={[styles.notifCard, { backgroundColor: c.bgCard, borderColor: c.border }, notif.unread && styles.notifUnread]}
              >
                <View style={[styles.notifIcon, { backgroundColor: notif.iconBg }]}>
                  <Ionicons name={notif.icon} size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 13, fontWeight: '600', color: c.text, letterSpacing: -0.1 }]}>{notif.title}</Text>
                  <Text style={[{ fontSize: 12, color: c.textDim, lineHeight: 18, marginTop: 1 }]}>{notif.description}</Text>
                  <Text style={[{ fontSize: 11, color: c.textMuted, marginTop: 3 }]}>{notif.time}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 14, paddingBottom: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 60 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  notifCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  notifUnread: {
    borderLeftWidth: 3,
    borderLeftColor: '#7C6AFF',
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
