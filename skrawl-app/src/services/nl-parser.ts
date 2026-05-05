/**
 * Natural Language Parser — extracts structured data from free-text input.
 * Uses chrono-node for date/time extraction. AI stub for advanced features.
 */
import * as chrono from 'chrono-node';
import type { PriorityLevel } from '@/src/theme/colors';
import type { NoteType } from '@/src/models';

export interface ParsedInput {
  title: string;
  reminderDate: Date | null;
  priority: PriorityLevel | null;
  folder: string | null;
  type: NoteType;
  recurrence: string | null;
  tags: string[];
}

const priorityPatterns: { pattern: RegExp; level: PriorityLevel }[] = [
  { pattern: /\b(urgent|critical|asap|p0)\b/i, level: 0 },
  { pattern: /\b(important|high|p1)\b/i, level: 1 },
  { pattern: /\b(medium|p2)\b/i, level: 2 },
  { pattern: /\b(low|whenever)\b/i, level: 2 },
];

const recurrencePatterns: { pattern: RegExp; recurrence: string }[] = [
  { pattern: /\bevery\s+day\b/i, recurrence: 'daily' },
  { pattern: /\bdaily\b/i, recurrence: 'daily' },
  { pattern: /\bevery\s+week\b/i, recurrence: 'weekly' },
  { pattern: /\bweekly\b/i, recurrence: 'weekly' },
  { pattern: /\bevery\s+month\b/i, recurrence: 'monthly' },
  { pattern: /\bmonthly\b/i, recurrence: 'monthly' },
  { pattern: /\bevery\s+monday\b/i, recurrence: 'weekly:1' },
  { pattern: /\bevery\s+tuesday\b/i, recurrence: 'weekly:2' },
  { pattern: /\bevery\s+wednesday\b/i, recurrence: 'weekly:3' },
  { pattern: /\bevery\s+thursday\b/i, recurrence: 'weekly:4' },
  { pattern: /\bevery\s+friday\b/i, recurrence: 'weekly:5' },
  { pattern: /\bevery\s+saturday\b/i, recurrence: 'weekly:6' },
  { pattern: /\bevery\s+sunday\b/i, recurrence: 'weekly:0' },
];

const typePatterns: { pattern: RegExp; type: NoteType }[] = [
  { pattern: /\b(list|checklist|shopping)\b/i, type: 'list' },
  { pattern: /\b(note|write|journal)\b/i, type: 'note' },
];

export function parseNaturalLanguage(input: string): ParsedInput {
  let text = input.trim();
  const tags: string[] = [];
  let priority: PriorityLevel | null = null;
  let recurrence: string | null = null;
  let type: NoteType = 'task';

  // Extract tags (#tag)
  const tagMatches = text.match(/#(\w+)/g);
  if (tagMatches) {
    tagMatches.forEach((t) => tags.push(t.slice(1)));
  }

  // Extract priority
  for (const { pattern, level } of priorityPatterns) {
    if (pattern.test(text)) {
      priority = level;
      text = text.replace(pattern, '').trim();
      break;
    }
  }

  // Extract recurrence
  for (const { pattern, recurrence: rec } of recurrencePatterns) {
    if (pattern.test(text)) {
      recurrence = rec;
      text = text.replace(pattern, '').trim();
      break;
    }
  }

  // Extract type hints
  for (const { pattern, type: t } of typePatterns) {
    if (pattern.test(text)) {
      type = t;
      break;
    }
  }

  // Custom date patterns chrono might miss
  const customDatePatterns: { pattern: RegExp; getDate: () => Date }[] = [
    { pattern: /\bby\s+(?:this\s+)?weekend\b/i, getDate: () => {
      const d = new Date(); const day = d.getDay();
      d.setDate(d.getDate() + (6 - day)); d.setHours(12, 0, 0, 0); return d;
    }},
    { pattern: /\bby\s+eod\b|\bby\s+end\s+of\s+day\b/i, getDate: () => {
      const d = new Date(); d.setHours(17, 0, 0, 0); return d;
    }},
    { pattern: /\bby\s+eow\b|\bby\s+end\s+of\s+week\b/i, getDate: () => {
      const d = new Date(); d.setDate(d.getDate() + (5 - d.getDay())); d.setHours(17, 0, 0, 0); return d;
    }},
    { pattern: /\bsecond\s+half\s+(?:of\s+)?today\b/i, getDate: () => {
      const d = new Date(); d.setHours(14, 0, 0, 0); return d;
    }},
    { pattern: /\bsecond\s+half\s+(?:of\s+)?tomorrow\b/i, getDate: () => {
      const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(14, 0, 0, 0); return d;
    }},
    { pattern: /\bfirst\s+half\s+(?:of\s+)?tomorrow\b/i, getDate: () => {
      const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); return d;
    }},
    { pattern: /\bthis\s+evening\b|\btonight\b/i, getDate: () => {
      const d = new Date(); d.setHours(19, 0, 0, 0); return d;
    }},
    { pattern: /\bthis\s+afternoon\b/i, getDate: () => {
      const d = new Date(); d.setHours(14, 0, 0, 0); return d;
    }},
  ];

  // Try custom patterns first
  let reminderDate: Date | null = null;
  let dateMatchText = '';
  for (const { pattern, getDate } of customDatePatterns) {
    const match = text.match(pattern);
    if (match) {
      reminderDate = getDate();
      dateMatchText = match[0];
      text = text.replace(match[0], '').trim();
      break;
    }
  }

  // Fall back to chrono-node — forwardDate ensures future dates
  if (!reminderDate) {
    const parsed = chrono.parse(text, new Date(), { forwardDate: true });
    if (parsed.length > 0) {
      reminderDate = parsed[0].start.date();
      dateMatchText = parsed[0].text;
      // Remove the date text AND the preposition before it (by, on, at, before, until)
      const fullPattern = new RegExp(`\\b(?:by|on|at|before|until|due|for)\\s+${dateMatchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      const fullMatch = text.match(fullPattern);
      if (fullMatch) {
        text = text.replace(fullMatch[0], '').trim();
      } else {
        text = text.replace(dateMatchText, '').trim();
      }
    }
  }

  // Clean up title — remove trailing prepositions, punctuation, extra spaces
  const title = text
    .replace(/\s+/g, ' ')
    .replace(/^[-–—]\s*/, '')
    .replace(/\s*[-–—]$/, '')
    .replace(/\s+(?:by|on|at|before|until|due|for)\s*$/i, '') // trailing preposition
    .trim();

  return {
    title: title || input.trim(),
    reminderDate,
    priority,
    folder: null,
    type,
    recurrence,
    tags,
  };
}

/**
 * Suggest a reminder time based on priority.
 * Every note gets a reminder — timing depends on urgency.
 */
export function suggestReminderForPriority(priority: PriorityLevel | null): Date {
  const now = new Date();
  if (priority === 0) {
    // P0: 1 hour from now
    return new Date(now.getTime() + 60 * 60 * 1000);
  }
  if (priority === 1) {
    // P1: tomorrow morning 9am
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  }
  if (priority === 2) {
    // P2: 3 days from now, 9am
    const d = new Date(now);
    d.setDate(d.getDate() + 3);
    d.setHours(9, 0, 0, 0);
    return d;
  }
  // No priority: 2 days from now, 9am
  const d = new Date(now);
  d.setDate(d.getDate() + 2);
  d.setHours(9, 0, 0, 0);
  return d;
}

/**
 * Suggest a priority based on how soon a reminder is due.
 * Closer deadline = higher priority.
 */
export function suggestPriorityFromDueDate(dueDate: Date): PriorityLevel {
  const now = new Date();
  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilDue <= 48) return 0;      // Due within 2 days → P0
  if (hoursUntilDue <= 72) return 1;      // Due within 3 days → P1
  return 2;                                // Due later → P2
}

/**
 * Auto-generate a title from body text (first meaningful line)
 */
export function autoTitle(body: string): string | null {
  if (!body || body.length < 10) return null;
  const firstLine = body.split('\n').find((l) => l.trim().length > 3);
  if (!firstLine) return null;
  const clean = firstLine.trim();
  if (clean.length <= 60) return clean;
  return clean.substring(0, 57) + '...';
}

/**
 * Format a recurrence string for display
 */
export function formatRecurrence(rec: string | null): string {
  if (!rec) return '';
  if (rec === 'daily') return 'Every day';
  if (rec === 'weekly') return 'Every week';
  if (rec === 'monthly') return 'Every month';
  if (rec.startsWith('weekly:')) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIdx = parseInt(rec.split(':')[1], 10);
    return `Every ${days[dayIdx] || 'week'}`;
  }
  return rec;
}
