/**
 * AI Service — Google Gemini integration for Skrawl.
 *
 * Uses Gemini 2.0 Flash (free tier: 15 RPM, 1M TPM).
 * Get a key at aistudio.google.com/apikey
 *
 * All prompts honour the personality/vibe setting.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const STORAGE_KEY = 'skrawl_gemini_key';

let _apiKey: string | null = null;
let _loaded = false;

// ===== Key Management =====

export async function loadApiKey(): Promise<void> {
  if (_loaded) return;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) _apiKey = stored;
  } catch {}
  _loaded = true;
}

export function getApiKey(): string | null {
  return _apiKey;
}

export async function setApiKey(key: string): Promise<void> {
  _apiKey = key.trim();
  _loaded = true;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, _apiKey);
  } catch {}
}

export async function clearApiKey(): Promise<void> {
  _apiKey = null;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function isConfigured(): boolean {
  return _loaded && !!_apiKey && _apiKey.length > 10;
}

export function isSessionActive(): boolean {
  return !!_apiKey;
}

/**
 * Verify an API key — list models endpoint (free, no tokens)
 */
export async function verifyApiKey(key: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
    );
    return response.ok;
  } catch {
    return false;
  }
}

// ===== Personality System Prompt =====

function getPersonalityPrompt(vibeValue: number): string {
  if (vibeValue <= 15) return 'You are a comedian assistant. Use jokes, puns, sarcasm, and make everything funny. Still be helpful but always entertaining.';
  if (vibeValue <= 35) return 'You are a witty assistant with sharp, dry humour. Clever observations and smart remarks, but get the job done.';
  if (vibeValue <= 65) return 'You are a balanced assistant — friendly, warm, and efficient. A good mix of personality and productivity.';
  if (vibeValue <= 85) return 'You are a hustler assistant. Driven, focused, always pushing forward. Motivate the user to take action and crush their goals.';
  return 'You are a drill sergeant assistant. No excuses, no fluff, no wasted words. Direct orders. Get it done. Now.';
}

// ===== Gemini API Call =====

async function callAI(prompt: string, vibeValue: number = 50, maxTokens: number = 200): Promise<string | null> {
  if (!_apiKey) {
    await loadApiKey();
    if (!_apiKey) return null;
  }

  try {
    const response = await fetch(`${API_URL}?key=${_apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: getPersonalityPrompt(vibeValue) }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}

// ===== AI Features =====

export async function suggestCategorization(
  title: string,
  folders: { id: string; name: string }[],
  vibeValue: number = 50,
): Promise<{ folderId: string | null; priority: number | null } | null> {
  const folderList = folders.map((f) => f.name).join(', ');
  const result = await callAI(
    `Given this note/task title: "${title}"
Available folders: ${folderList || 'none'}
Suggest the best folder name (or "none") and priority level (0=critical, 1=high, 2=medium, null=unset).
Reply ONLY as JSON: {"folder":"name","priority":1}`,
    vibeValue, 100,
  );
  if (!result) return null;
  try {
    const jsonStr = result.match(/\{[\s\S]*?\}/)?.[0];
    if (!jsonStr) return null;
    const parsed = JSON.parse(jsonStr);
    const folder = folders.find((f) => f.name.toLowerCase() === parsed.folder?.toLowerCase());
    return { folderId: folder?.id || null, priority: typeof parsed.priority === 'number' ? parsed.priority : null };
  } catch { return null; }
}

export async function generateTitle(body: string, vibeValue: number = 50): Promise<string | null> {
  return callAI(
    `Generate a concise title (max 8 words) for this note. Reply with ONLY the title, no quotes:\n\n${body.substring(0, 500)}`,
    vibeValue, 50,
  );
}

export async function processVoiceInput(
  input: string,
  currentNote: { title: string; body: string; priority: number | null },
  vibeValue: number = 50,
): Promise<{ title?: string; body?: string; priority?: number } | null> {
  const result = await callAI(
    `User wants to update their note via voice command.
Current note - Title: "${currentNote.title}", Body: "${currentNote.body}", Priority: ${currentNote.priority ?? 'none'}
User said: "${input}"
Interpret and reply ONLY as JSON with fields to update:
{"title":"new title","body":"new body","priority":0}
Only include fields that should change.`,
    vibeValue, 200,
  );
  if (!result) return null;
  try {
    const jsonStr = result.match(/\{[\s\S]*?\}/)?.[0];
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch { return null; }
}

export async function generateBriefing(notesSummary: string, vibeValue: number = 50): Promise<string | null> {
  return callAI(
    `You're a productivity assistant. Given these active notes/tasks:\n${notesSummary}\n\nWrite a single short sentence (max 15 words) as a daily briefing. Be actionable.`,
    vibeValue, 30,
  );
}

export async function analyzeInsight(
  notes: { id: string; title: string; priority: number | null; isDone: boolean; reminderDate: string | null; isOverdue: boolean; daysUntilDue: number | null }[],
  vibeValue: number = 50,
): Promise<{ noteId: string; reason: string; action: string } | null> {
  const summary = notes.slice(0, 10).map((n) =>
    `- "${n.title}" P${n.priority ?? '?'} ${n.isOverdue ? 'OVERDUE' : n.daysUntilDue !== null ? `due in ${n.daysUntilDue}d` : 'no date'}`
  ).join('\n');
  const result = await callAI(
    `Analyze this task list for the MOST CRITICAL item.
Rules: 1. Overdue = most critical. 2. P0 due soonest. 3. P1 due within 3 days. 4. No priority but overdue.
Tasks:
${summary}
Pick the single most critical. Reply ONLY as JSON:
{"noteId":"id","reason":"short reason","action":"what user should do"}`,
    vibeValue, 100,
  );
  if (!result) return null;
  try {
    const jsonStr = result.match(/\{[\s\S]*?\}/)?.[0];
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch { return null; }
}

export async function suggestFolderOrganization(
  notes: { id: string; title: string; folderId: string | null }[],
  folders: { id: string; name: string }[],
  vibeValue: number = 50,
): Promise<{ suggestions: { noteId: string; noteTitle: string; folderName: string; isNew: boolean }[] } | null> {
  const unfiled = notes.filter((n) => !n.folderId);
  if (unfiled.length < 2) return null;
  const folderList = folders.map((f) => f.name).join(', ') || 'none';
  const noteList = unfiled.slice(0, 15).map((n) => `- "${n.title}" (id: ${n.id})`).join('\n');
  const result = await callAI(
    `Organize these unfiled notes into folders.
Existing folders: ${folderList}
Unfiled notes:
${noteList}
Suggest the best folder for each (or create new ones if 2+ similar notes).
Reply ONLY as JSON:
{"suggestions":[{"noteId":"id","noteTitle":"title","folderName":"Work","isNew":false}]}
Skip ambiguous notes.`,
    vibeValue, 400,
  );
  if (!result) return null;
  try {
    const jsonStr = result.match(/\{[\s\S]*\}/)?.[0];
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch { return null; }
}

export async function generateGreeting(
  userName: string, noteCount: number, urgentCount: number, timeOfDay: string, vibeValue: number = 50,
): Promise<string | null> {
  return callAI(
    `Generate a short greeting (max 12 words) for ${userName}. It's ${timeOfDay}. They have ${noteCount} active items, ${urgentCount} urgent. Reply with ONLY the greeting, no quotes.`,
    vibeValue, 30,
  );
}

export async function generateNudge(
  action: 'create' | 'complete' | 'delete' | 'save' | 'all_clear',
  noteTitle: string, vibeValue: number = 50,
): Promise<string | null> {
  const prompts: Record<string, string> = {
    create: `User just created "${noteTitle}". Short celebratory nudge (max 10 words). ONLY the text.`,
    complete: `User completed "${noteTitle}". Short celebration (max 10 words). ONLY the text.`,
    delete: `User deleted "${noteTitle}". Short witty farewell (max 10 words). ONLY the text.`,
    save: `User saved "${noteTitle}". Short acknowledgment (max 8 words). ONLY the text.`,
    all_clear: `User cleared all urgent tasks. Victory message (max 10 words). ONLY the text.`,
  };
  return callAI(prompts[action] || prompts.save, vibeValue, 20);
}
