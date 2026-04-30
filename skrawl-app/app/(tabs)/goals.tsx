import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors, colors, typography, spacing, radii } from '@/src/theme';
import { useUIStore } from '@/src/store/ui-store';
import { useGoalStore } from '@/src/store/goal-store';
import { ContextToggle } from '@/src/components/common/ContextToggle';
import type { Goal, GoalPeriod } from '@/src/models';
import Ionicons from '@expo/vector-icons/Ionicons';

const goalColors = ['#7C6AFF', '#FF6AC2', '#6AFFCB', '#FFB86A', '#6AB4FF', '#FF5A5A'];
const categories = [
  { value: 'all', label: 'All', icon: 'layers-outline' as const },
  { value: 'fitness', label: 'Fitness', icon: 'fitness-outline' as const },
  { value: 'nutrition', label: 'Nutrition', icon: 'restaurant-outline' as const },
  { value: 'learning', label: 'Learning', icon: 'book-outline' as const },
  { value: 'health', label: 'Health', icon: 'heart-outline' as const },
  { value: 'general', label: 'General', icon: 'flag-outline' as const },
];
const periods: { value: 'all' | GoalPeriod; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function GoalsScreen() {
  const c = useThemeColors();
  const context = useUIStore((s) => s.context);
  const { goals, loadGoals, addGoal, incrementGoal, deleteGoal } = useGoalStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newColor, setNewColor] = useState(goalColors[0]);
  const [newCategory, setNewCategory] = useState('general');
  const [newPeriod, setNewPeriod] = useState<GoalPeriod>('daily');
  const [filterPeriod, setFilterPeriod] = useState<'all' | GoalPeriod>('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => { loadGoals(context); }, [context]);

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (filterPeriod !== 'all' && g.period !== filterPeriod) return false;
      if (filterCategory !== 'all' && g.category !== filterCategory) return false;
      return true;
    });
  }, [goals, filterPeriod, filterCategory]);

  const handleCreate = async () => {
    if (!newName.trim() || !newTarget.trim()) return;
    await addGoal({
      name: newName.trim(), context, target: parseFloat(newTarget) || 1,
      unit: newUnit.trim() || 'times', color: newColor, category: newCategory, period: newPeriod,
    });
    setNewName(''); setNewTarget(''); setNewUnit(''); setShowCreate(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const totalGoals = goals.length;
  const completed = goals.filter((g) => g.current >= g.target).length;
  const totalStreak = goals.reduce((sum, g) => sum + g.streak, 0);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.headerWrap}>
          <View style={styles.headerRow}>
            <Text style={[typography.heading, { color: c.text }]}>Goals</Text>
            <ContextToggle />
          </View>
        </View>

        {/* AI Goal Assistant card */}
        <Pressable style={[styles.aiCard, { overflow: 'hidden' }]} onPress={() => {}}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.accent, opacity: 0.15, borderRadius: radii.md }]} />
          <View style={{ flex: 1, zIndex: 1 }}>
            <Text style={[{ fontSize: 13, fontWeight: '600', color: c.text }]}>AI Goal Assistant</Text>
            <Text style={[{ fontSize: 11, color: c.textDim, marginTop: 2 }]}>Get personalized goal suggestions</Text>
          </View>
          <View style={[styles.aiIcon, { backgroundColor: c.accentGlow }]}>
            <Ionicons name="sparkles" size={18} color={c.accent} />
          </View>
        </Pressable>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Text style={[styles.summaryNum, { color: c.accent }]}>{completed}/{totalGoals}</Text>
            <Text style={[typography.tiny, { color: c.textMuted }]}>Completed</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Text style={[styles.summaryNum, { color: c.accent3 }]}>{totalStreak}</Text>
            <Text style={[typography.tiny, { color: c.textMuted }]}>Streak</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Text style={[styles.summaryNum, { color: c.accent4 }]}>{totalGoals > 0 ? Math.round((completed / totalGoals) * 100) : 0}%</Text>
            <Text style={[typography.tiny, { color: c.textMuted }]}>Rate</Text>
          </View>
        </View>

        {/* Category filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {categories.map((cat) => {
            const sel = filterCategory === cat.value;
            return (
              <Pressable key={cat.value} style={[styles.catChip, { borderColor: sel ? c.accent : c.border }, sel && { backgroundColor: c.accentGlow }]} onPress={() => setFilterCategory(cat.value)}>
                <Ionicons name={cat.icon} size={14} color={sel ? c.accent : c.textDim} />
                <Text style={[{ fontSize: 12, fontWeight: '600', color: sel ? c.accent : c.textDim }]}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Period tabs */}
        <View style={[styles.periodTabs, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          {periods.map((p) => (
            <Pressable key={p.value} style={[styles.periodTab, filterPeriod === p.value && { backgroundColor: c.accent }]} onPress={() => setFilterPeriod(p.value)}>
              <Text style={[{ fontSize: 12, fontWeight: '600', color: filterPeriod === p.value ? '#fff' : c.textMuted }]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Goal list */}
        {filteredGoals.length === 0 && !showCreate ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={48} color={c.textMuted} />
            <Text style={[typography.label, { color: c.textMuted, marginTop: 12 }]}>No goals yet</Text>
            <Text style={[typography.caption, { color: c.textMuted, marginTop: 4 }]}>Create your first goal to start tracking</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.xl, gap: 10 }}>
            {filteredGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal}
                onIncrement={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); incrementGoal(goal.id, 1); }}
                onDelete={() => deleteGoal(goal.id)}
              />
            ))}
          </View>
        )}

        {/* Create form */}
        {showCreate && (
          <Animated.View entering={FadeIn.duration(200)} style={[styles.createForm, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <TextInput style={[styles.formInput, typography.body, { color: c.text, borderColor: c.border, backgroundColor: c.bgInput }]} placeholder="Goal name" placeholderTextColor={c.textMuted} value={newName} onChangeText={setNewName} autoFocus />
            <View style={styles.formRow}>
              <TextInput style={[styles.formInput, typography.body, { color: c.text, borderColor: c.border, backgroundColor: c.bgInput, flex: 1 }]} placeholder="Target" placeholderTextColor={c.textMuted} value={newTarget} onChangeText={setNewTarget} keyboardType="numeric" />
              <TextInput style={[styles.formInput, typography.body, { color: c.text, borderColor: c.border, backgroundColor: c.bgInput, flex: 1 }]} placeholder="Unit" placeholderTextColor={c.textMuted} value={newUnit} onChangeText={setNewUnit} />
            </View>
            {/* Category selector */}
            <View style={styles.formRow}>
              {categories.filter((c) => c.value !== 'all').map((cat) => (
                <Pressable key={cat.value} style={[styles.catChipSm, { borderColor: newCategory === cat.value ? '#7C6AFF' : 'rgba(255,255,255,0.06)' }, newCategory === cat.value && { backgroundColor: 'rgba(124,106,255,0.2)' }]} onPress={() => setNewCategory(cat.value)}>
                  <Text style={[{ fontSize: 11, fontWeight: '600', color: newCategory === cat.value ? '#7C6AFF' : '#9595A5' }]}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>
            {/* Period selector */}
            <View style={styles.formRow}>
              {periods.filter((p) => p.value !== 'all').map((p) => (
                <Pressable key={p.value} style={[styles.catChipSm, { borderColor: newPeriod === p.value ? '#7C6AFF' : 'rgba(255,255,255,0.06)' }, newPeriod === p.value && { backgroundColor: 'rgba(124,106,255,0.2)' }]} onPress={() => setNewPeriod(p.value as GoalPeriod)}>
                  <Text style={[{ fontSize: 11, fontWeight: '600', color: newPeriod === p.value ? '#7C6AFF' : '#9595A5' }]}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.colorRow}>
              {goalColors.map((gc) => (
                <Pressable key={gc} style={[styles.colorDot, { backgroundColor: gc, borderColor: newColor === gc ? '#fff' : 'transparent' }]} onPress={() => setNewColor(gc)} />
              ))}
            </View>
            <View style={styles.formActions}>
              <Pressable onPress={() => setShowCreate(false)}><Text style={[typography.label, { color: '#9595A5' }]}>Cancel</Text></Pressable>
              <Pressable onPress={handleCreate} style={[styles.createBtn, { backgroundColor: newName.trim() && newTarget.trim() ? '#7C6AFF' : '#16161A' }]}>
                <Text style={[typography.label, { color: newName.trim() && newTarget.trim() ? '#fff' : '#55556A' }]}>Create</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {!showCreate && (
        <Pressable style={[styles.fab, { backgroundColor: c.accent }]} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

function GoalCard({ goal, onIncrement, onDelete }: { goal: Goal; onIncrement: () => void; onDelete: () => void }) {
  const c = useThemeColors();
  const progress = goal.target > 0 ? Math.min(goal.current / goal.target, 1) : 0;
  const isComplete = goal.current >= goal.target;
  const color = goal.color || c.accent;

  // Streak dots (last 7 days)
  const streakDots = Array.from({ length: 7 }, (_, i) => {
    if (i < goal.streak) return 'hit';
    if (i === goal.streak) return 'today';
    return 'miss';
  });

  return (
    <View style={[styles.goalCard, { backgroundColor: c.bgCard, borderColor: isComplete ? 'rgba(106,255,203,0.2)' : c.border }]}>
      <View style={styles.goalHeader}>
        <View style={[styles.goalIcon, { backgroundColor: `${color}22` }]}>
          <Ionicons name={(goal.icon as keyof typeof Ionicons.glyphMap) || 'flag'} size={18} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[typography.label, { color: c.text }]}>{goal.name}</Text>
            {goal.streak > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 6 }}>
                <Ionicons name="flame" size={12} color="#FF6A3D" />
                <Text style={[{ fontSize: 10, fontWeight: '800', color: '#FF6A3D' }]}>{goal.streak}</Text>
              </View>
            )}
          </View>
          <Text style={[typography.tiny, { color: c.textMuted }]}>{goal.current}/{goal.target} {goal.unit} · {goal.period}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: c.border }]}>
        <View style={[styles.progressFill, { backgroundColor: color, width: `${Math.round(progress * 100)}%` }]} />
      </View>

      {/* Streak dots */}
      <View style={styles.streakRow}>
        {streakDots.map((d, i) => (
          <View key={i} style={[styles.streakDot, d === 'hit' && { backgroundColor: c.accent3 }, d === 'miss' && { backgroundColor: c.border }, d === 'today' && { borderWidth: 1.5, borderColor: c.textDim, backgroundColor: 'transparent' }]} />
        ))}
      </View>

      <View style={styles.goalActions}>
        <Pressable onPress={onIncrement} style={[styles.incrementBtn, { backgroundColor: isComplete ? `${c.accent3}22` : `${color}22`, borderColor: isComplete ? c.accent3 : color }]}>
          <Ionicons name={isComplete ? 'checkmark' : 'add'} size={16} color={isComplete ? c.accent3 : color} />
          <Text style={[{ fontSize: 12, fontWeight: '700', color: isComplete ? c.accent3 : color }]}>{isComplete ? 'Done!' : '+1'}</Text>
        </Pressable>
        <Text style={[typography.caption, { color: c.textMuted }]}>{Math.round(progress * 100)}%</Text>
        <Pressable onPress={onDelete} hitSlop={8}><Ionicons name="trash-outline" size={16} color={c.textMuted} /></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: { paddingTop: 60, paddingHorizontal: spacing.xl, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiCard: { marginHorizontal: spacing.xl, marginBottom: 12, padding: 14, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.xl, paddingBottom: 12 },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: radii.md, borderWidth: 1, gap: 2 },
  summaryNum: { fontSize: 22, fontWeight: '800' },
  chipScroll: { gap: 6, paddingHorizontal: spacing.xl, paddingBottom: 10 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, borderWidth: 1 },
  catChipSm: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, borderWidth: 1 },
  periodTabs: { flexDirection: 'row', marginHorizontal: spacing.xl, marginBottom: 14, borderRadius: 100, borderWidth: 1, padding: 3 },
  periodTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 100 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  goalCard: { borderRadius: radii.md, borderWidth: 1, padding: 14, gap: 10 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  streakRow: { flexDirection: 'row', gap: 3 },
  streakDot: { width: 8, height: 8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)' },
  goalActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  incrementBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1 },
  createForm: { marginHorizontal: spacing.xl, marginTop: 16, borderRadius: radii.lg, borderWidth: 1, padding: 16, gap: 12 },
  formInput: { borderWidth: 1, borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 10 },
  formRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  colorRow: { flexDirection: 'row', gap: 8 },
  colorDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  createBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 100 },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#7C6AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
});
