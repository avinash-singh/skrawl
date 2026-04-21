import { getDb } from './database';

export async function seedIfEmpty(): Promise<void> {
  const db = getDb();
  const count = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM notes');
  if (count && count.c > 0) return; // Already has data

  // Seed folders
  const folders = [
    { id: 'f1', name: 'Inbox', context: 'personal', icon: 'inbox', color: '#7C6AFF', sort: 0 },
    { id: 'f2', name: 'Health', context: 'personal', icon: 'heart', color: '#6AFFCB', sort: 1 },
    { id: 'f3', name: 'Travel', context: 'personal', icon: 'file', color: '#FFB86A', sort: 2 },
    { id: 'f4', name: 'Work', context: 'business', icon: 'briefcase', color: '#4A9FFF', sort: 0 },
    { id: 'f5', name: 'Meetings', context: 'business', icon: 'calendar', color: '#FF6AC2', sort: 1 },
  ];
  for (const f of folders) {
    await db.runAsync(
      'INSERT INTO folders (id, name, context, icon, color, sort) VALUES (?, ?, ?, ?, ?, ?)',
      [f.id, f.name, f.context, f.icon, f.color, f.sort]
    );
  }

  // Seed notes
  const notes = [
    { id: 'n1', title: 'Grocery List', body: '', context: 'personal', folder_id: 'f1', color: 'green', type: 'list', priority: 1, is_pinned: 1 },
    { id: 'n2', title: 'Dentist Appointment', body: 'Dr. Patel — Tuesday at 2:30pm. Remember to bring insurance card.', context: 'personal', folder_id: 'f2', color: 'blue', type: 'note', priority: 1, is_pinned: 1 },
    { id: 'n3', title: 'Call dentist to confirm', body: '', context: 'personal', folder_id: 'f2', color: 'default', type: 'task', priority: 0 },
    { id: 'n4', title: 'Buy birthday gift for Mom', body: '', context: 'personal', folder_id: 'f1', color: 'default', type: 'task', priority: 1 },
    { id: 'n5', title: 'Workout Plan', body: 'Mon: Upper body\nTue: Cardio\nWed: Lower body\nThu: Rest\nFri: Full body', context: 'personal', folder_id: 'f2', color: 'orange', type: 'note', priority: 2 },
    { id: 'n6', title: 'Book Recommendations', body: 'The Midnight Library — Matt Haig\nProject Hail Mary — Andy Weir\nKlara and the Sun — Kazuo Ishiguro', context: 'personal', folder_id: 'f1', color: 'purple', type: 'note', priority: 3 },
    { id: 'n7', title: 'Weekend Trip Ideas', body: 'Napa Valley, Big Sur, Lake Tahoe, Joshua Tree', context: 'personal', folder_id: 'f3', color: 'yellow', type: 'note', priority: null },
    { id: 'n8', title: 'Sprint Planning', body: 'Q2: Migrate auth to OAuth 2.1, rate limiting on APIs, p95 < 200ms.', context: 'business', folder_id: 'f4', color: 'blue', type: 'note', priority: 0, is_pinned: 1 },
    { id: 'n9', title: 'Client Meeting Prep', body: '', context: 'business', folder_id: 'f5', color: 'default', type: 'list', priority: 0, is_pinned: 1 },
    { id: 'n10', title: 'Send Q1 report to Sarah', body: '', context: 'business', folder_id: 'f4', color: 'default', type: 'task', priority: 0 },
    { id: 'n11', title: 'Book flight for conference', body: '', context: 'business', folder_id: 'f4', color: 'default', type: 'task', priority: 1 },
    { id: 'n12', title: 'API Design Review', body: 'POST /v2/notes\nGET /v2/search\nWS /v2/sync\n\nFinalize pagination.', context: 'business', folder_id: 'f4', color: 'orange', type: 'note', priority: 1 },
  ];
  for (const n of notes) {
    await db.runAsync(
      'INSERT INTO notes (id, title, body, context, folder_id, color, type, priority, is_pinned) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [n.id, n.title, n.body, n.context, n.folder_id, n.color, n.type, n.priority, n.is_pinned || 0]
    );
  }

  // Checklist items for Grocery List
  const groceryItems = [
    { id: 'ci1', note_id: 'n1', text: 'Avocados', is_done: 1, sort: 0 },
    { id: 'ci2', note_id: 'n1', text: 'Oat milk', is_done: 1, sort: 1 },
    { id: 'ci3', note_id: 'n1', text: 'Sourdough bread', is_done: 0, sort: 2 },
    { id: 'ci4', note_id: 'n1', text: 'Fresh salmon', is_done: 0, sort: 3 },
    { id: 'ci5', note_id: 'n1', text: 'Lemons', is_done: 0, sort: 4 },
  ];
  for (const i of groceryItems) {
    await db.runAsync(
      'INSERT INTO checklist_items (id, note_id, text, is_done, sort) VALUES (?, ?, ?, ?, ?)',
      [i.id, i.note_id, i.text, i.is_done, i.sort]
    );
  }

  // Checklist items for Client Meeting Prep
  const meetingItems = [
    { id: 'ci6', note_id: 'n9', text: 'Review Q1 metrics', is_done: 1, sort: 0 },
    { id: 'ci7', note_id: 'n9', text: 'Prepare demo', is_done: 1, sort: 1 },
    { id: 'ci8', note_id: 'n9', text: 'Update roadmap', is_done: 0, sort: 2 },
    { id: 'ci9', note_id: 'n9', text: 'Send agenda', is_done: 0, sort: 3 },
  ];
  for (const i of meetingItems) {
    await db.runAsync(
      'INSERT INTO checklist_items (id, note_id, text, is_done, sort) VALUES (?, ?, ?, ?, ?)',
      [i.id, i.note_id, i.text, i.is_done, i.sort]
    );
  }
}
