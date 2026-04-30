import { create } from 'zustand';
import type { Goal, MealEntry, ExerciseEntry, Context } from '@/src/models';
import * as db from '@/src/services/database';

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

interface GoalState {
  goals: Goal[];
  meals: MealEntry[];
  exercises: ExerciseEntry[];

  loadGoals: (context: Context) => Promise<void>;
  addGoal: (goal: Partial<Goal> & { name: string; context: Context; target: number }) => Promise<Goal>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  incrementGoal: (id: string, amount: number) => Promise<void>;

  loadMeals: () => Promise<void>;
  addMeal: (meal: MealEntry) => Promise<void>;
  loadExercises: () => Promise<void>;
  addExercise: (entry: ExerciseEntry) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  meals: [],
  exercises: [],

  loadGoals: async (context) => {
    try {
      const d = db.getDb();
      const rows = await d.getAllAsync<any>('SELECT * FROM goals WHERE context = ? ORDER BY created_at DESC', [context]);
      set({
        goals: rows.map((r: any) => ({
          id: r.id, name: r.name, context: r.context, target: r.target, current: r.current,
          unit: r.unit, color: r.color, period: r.period, frequency: r.frequency,
          icon: r.icon, category: r.category, reminder: r.reminder, streak: r.streak,
          createdAt: r.created_at, isDirty: !!r.is_dirty,
        })),
      });
    } catch { /* empty */ }
  },

  addGoal: async (partial) => {
    const goal: Goal = {
      id: genId(),
      name: partial.name,
      context: partial.context,
      target: partial.target,
      current: 0,
      unit: partial.unit || '',
      color: partial.color || '#7C6AFF',
      period: partial.period || 'daily',
      frequency: partial.frequency || '',
      icon: partial.icon || 'flag',
      category: partial.category || 'general',
      reminder: null,
      streak: 0,
      createdAt: new Date().toISOString(),
      isDirty: true,
    };
    const d = db.getDb();
    await d.runAsync(
      'INSERT INTO goals (id, name, context, target, current, unit, color, period, frequency, icon, category, streak) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [goal.id, goal.name, goal.context, goal.target, goal.current, goal.unit, goal.color, goal.period, goal.frequency, goal.icon, goal.category, goal.streak]
    );
    set((s) => ({ goals: [goal, ...s.goals] }));
    return goal;
  },

  updateGoal: async (goal) => {
    const d = db.getDb();
    await d.runAsync(
      'UPDATE goals SET name=?, target=?, current=?, unit=?, color=?, period=?, icon=?, category=?, streak=?, is_dirty=1 WHERE id=?',
      [goal.name, goal.target, goal.current, goal.unit, goal.color, goal.period, goal.icon, goal.category, goal.streak, goal.id]
    );
    set((s) => ({ goals: s.goals.map((g) => (g.id === goal.id ? goal : g)) }));
  },

  deleteGoal: async (id) => {
    const d = db.getDb();
    await d.runAsync('DELETE FROM goals WHERE id = ?', [id]);
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
  },

  incrementGoal: async (id, amount) => {
    const goal = get().goals.find((g) => g.id === id);
    if (!goal) return;
    const newCurrent = goal.current + amount;
    const hitTarget = newCurrent >= goal.target && goal.current < goal.target;
    const updated = {
      ...goal,
      current: newCurrent,
      streak: hitTarget ? goal.streak + 1 : goal.streak,
    };
    await get().updateGoal(updated);
  },

  loadMeals: async () => {
    try {
      const d = db.getDb();
      const rows = await d.getAllAsync<any>('SELECT * FROM meal_entries ORDER BY created_at DESC LIMIT 50');
      set({
        meals: rows.map((r: any) => ({
          id: r.id, goalId: r.goal_id, description: r.description, imageUrl: r.image_url,
          caloriesDetected: r.calories_detected, caloriesOverride: r.calories_override,
          mealType: r.meal_type, aiConfidence: r.ai_confidence, source: r.source,
          createdAt: r.created_at, isDirty: !!r.is_dirty,
        })),
      });
    } catch { /* empty */ }
  },

  addMeal: async (meal) => {
    const d = db.getDb();
    await d.runAsync(
      'INSERT INTO meal_entries (id, goal_id, description, calories_detected, meal_type, source) VALUES (?, ?, ?, ?, ?, ?)',
      [meal.id, meal.goalId, meal.description, meal.caloriesDetected, meal.mealType, meal.source]
    );
    set((s) => ({ meals: [meal, ...s.meals] }));
  },

  loadExercises: async () => {
    try {
      const d = db.getDb();
      const rows = await d.getAllAsync<any>('SELECT * FROM exercise_entries ORDER BY created_at DESC LIMIT 50');
      set({
        exercises: rows.map((r: any) => ({
          id: r.id, goalId: r.goal_id, type: r.type, durationMin: r.duration_min,
          caloriesBurned: r.calories_burned, source: r.source,
          createdAt: r.created_at, isDirty: !!r.is_dirty,
        })),
      });
    } catch { /* empty */ }
  },

  addExercise: async (entry) => {
    const d = db.getDb();
    await d.runAsync(
      'INSERT INTO exercise_entries (id, goal_id, type, duration_min, calories_burned, source) VALUES (?, ?, ?, ?, ?, ?)',
      [entry.id, entry.goalId, entry.type, entry.durationMin, entry.caloriesBurned, entry.source]
    );
    set((s) => ({ exercises: [entry, ...s.exercises] }));
  },
}));
