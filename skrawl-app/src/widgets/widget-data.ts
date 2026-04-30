/**
 * Widget data provider — generates data payloads for iOS/Android widgets.
 * These functions are called from the native widget extension to get fresh data.
 *
 * Widget types:
 * 1. Top Items — 3-5 prioritized items with checkboxes
 * 2. Quick Add — deep link to quick capture
 * 3. Speech Input — deep link to voice mode
 * 4. AI Assistant — today's briefing summary
 * 5. Goal Streak — progress rings for top 3 goals
 *
 * Integration: Install react-native-widget-kit (iOS) or @mccsoft/react-native-widget (Android),
 * then call these from the widget timeline provider.
 */

import * as db from '@/src/services/database';

export interface WidgetTopItem {
  id: string;
  title: string;
  priority: number | null;
  isDone: boolean;
  type: string;
}

export interface WidgetGoalProgress {
  id: string;
  name: string;
  progress: number; // 0-1
  color: string;
  streak: number;
}

export interface WidgetBriefing {
  dueCount: number;
  overdueCount: number;
  topItemTitle: string;
  streakTotal: number;
  greeting: string;
}

/**
 * Get top prioritized items for the widget
 */
export async function getTopItems(context: string, limit: number = 5): Promise<WidgetTopItem[]> {
  try {
    const notes = await db.getAllNotes(context);
    return notes
      .filter((n) => !n.isDone)
      .sort((a, b) => {
        const pa = a.priority ?? 99;
        const pb = b.priority ?? 99;
        return pa - pb;
      })
      .slice(0, limit)
      .map((n) => ({
        id: n.id,
        title: n.title || 'Untitled',
        priority: n.priority,
        isDone: n.isDone,
        type: n.type,
      }));
  } catch {
    return [];
  }
}

/**
 * Get goal progress for the widget
 */
export async function getGoalProgress(context: string, limit: number = 3): Promise<WidgetGoalProgress[]> {
  try {
    const d = db.getDb();
    const rows = await d.getAllAsync<any>(
      'SELECT * FROM goals WHERE context = ? ORDER BY streak DESC LIMIT ?',
      [context, limit]
    );
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      progress: r.target > 0 ? Math.min(r.current / r.target, 1) : 0,
      color: r.color || '#7C6AFF',
      streak: r.streak || 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Get today's briefing for the AI assistant widget
 */
export async function getBriefing(context: string): Promise<WidgetBriefing> {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  try {
    const notes = await db.getAllNotes(context);
    const active = notes.filter((n) => !n.isDone);
    const urgent = active.filter((n) => n.priority !== null && n.priority <= 1);
    const topItem = urgent[0] || active[0];

    return {
      dueCount: active.length,
      overdueCount: urgent.length,
      topItemTitle: topItem?.title || 'All clear!',
      streakTotal: 0,
      greeting,
    };
  } catch {
    return {
      dueCount: 0, overdueCount: 0, topItemTitle: 'All clear!',
      streakTotal: 0, greeting,
    };
  }
}

/**
 * Deep link URLs for widgets
 */
export const WIDGET_LINKS = {
  quickAdd: 'skrawlapp://capture',
  voiceInput: 'skrawlapp://voice',
  openNote: (id: string) => `skrawlapp://note/${id}`,
  goals: 'skrawlapp://goals',
};
