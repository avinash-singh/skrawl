import type { Context } from './note';

export type GoalPeriod = 'daily' | 'weekly' | 'monthly';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type EntrySource = 'manual' | 'image' | 'suggestion' | 'health_kit';

export interface Goal {
  id: string;
  name: string;
  context: Context;
  target: number;
  current: number;
  unit: string;
  color: string;
  period: GoalPeriod;
  frequency: string;
  icon: string;
  category: string;
  reminder: string | null;
  streak: number;
  createdAt: string;
  isDirty: boolean;
}

export interface MealEntry {
  id: string;
  goalId: string;
  description: string;
  imageUrl: string | null;
  caloriesDetected: number | null;
  caloriesOverride: number | null;
  mealType: MealType;
  aiConfidence: number | null;
  source: EntrySource;
  createdAt: string;
  isDirty: boolean;
}

export interface ExerciseEntry {
  id: string;
  goalId: string;
  type: string;
  durationMin: number;
  caloriesBurned: number;
  source: EntrySource;
  createdAt: string;
  isDirty: boolean;
}
