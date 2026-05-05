/**
 * AI Service — OpenAI integration for Skrawl.
 *
 * Uses GPT-4o-mini (cheapest, fastest).
 * Get a key at platform.openai.com/api-keys
 *
 * All prompts honour the personality/vibe setting:
 * 0 = humorous, 100 = motivational/professional
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';
const STORAGE_KEY = 'skrawl_openai_key';

let _apiKey: string | null = null;
let _loaded = false;

// ===== Key Management (persisted to AsyncStorage) =====

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
  return !!_apiKey && _apiKey.length > 10;
}

export function isSessionActive(): boolean {
  return !!_apiKey;
}

/**
 * Verify an API key works — uses the models list endpoint (free, no tokens consumed)
 */
export async function verifyApiKey(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
      },
    });
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

// ===== OpenAI API Call =====

async function callAI(prompt: string, vibeValue: number = 50, maxTokens: number = 200): Promise<string | null> {
  if (!_apiKey) return null;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${_apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [
          { role: 'system', content: getPersonalityPrompt(vibeValue) },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

// ===== AI Features =====

/**
 * Suggest folder + priority for a note based on title
 */
export async function suggestCategorization(
  title: string,
  folders: { id: string; name: string }[],
  vibeValue: number = 50,
): Promise<{ folderId: string | null; priority: number | null } | null> {
  const folderList = folders.map((f) => f.name).join(', ');
  const result = await callAI(
    `Given this note/task title: "${title}"
Available folders: ${folderList || 'none'}
Suggest the best folder name (or "none") and priority level (0=critical, 1=high, 2=medium, 3=low, null=unset).
Reply ONLY as JSON: {"folder":"name","priority":1}`,
    vibeValue,
    100,
  );

  if (!result) return null;
  try {
    const jsonStr = result.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonStr) return null;
    const parsed = JSON.parse(jsonStr);
    const folder = folders.find((f) => f.name.toLowerCase() === parsed.folder?.toLowerCase());
    return { folderId: folder?.id || null, priority: typeof parsed.priority === 'number' ? parsed.priority : null };
  } catch {
    return null;
  }
}

/**
 * Generate a title from body text
 */
export async function generateTitle(body: string, vibeValue: number = 50): Promise<string | null> {
  return callAI(
    `Generate a concise title (max 8 words) for this note. Reply with ONLY the title, no quotes or explanation:\n\n${body.substring(0, 500)}`,
    vibeValue,
    50,
  );
}

/**
 * Process voice/text input and return structured updates for a note
 */
export async function processVoiceInput(
  input: string,
  currentNote: { title: string; body: string; priority: number | null },
  vibeValue: number = 50,
): Promise<{ title?: string; body?: string; priority?: number } | null> {
  const result = await callAI(
    `User wants to update their note via voice command.
Current note - Title: "${currentNote.title}", Body: "${currentNote.body}", Priority: ${currentNote.priority ?? 'none'}
User said: "${input}"

Interpret what they want and reply ONLY as JSON with fields to update:
{"title":"new title","body":"new or appended body","priority":0}
Only include fields that should change. For body, if appending, include the full new body.`,
    vibeValue,
    200,
  );

  if (!result) return null;
  try {
    const jsonStr = result.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonStr) return null;
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Generate a smart briefing message for the AI banner
 */
export async function generateBriefing(
  notesSummary: string,
  vibeValue: number = 50,
): Promise<string | null> {
  return callAI(
    `You're a productivity assistant. Given these active notes/tasks:\n${notesSummary}\n\nWrite a single short sentence (max 15 words) as a daily briefing. Be actionable.`,
    vibeValue,
    30,
  );
}

/**
 * Suggest goals based on existing ones
 */
export async function suggestGoals(
  existingGoals: string[],
  vibeValue: number = 50,
): Promise<{ name: string; target: number; unit: string; category: string }[] | null> {
  const result = await callAI(
    `Suggest 3 personal improvement goals. Existing: ${existingGoals.join(', ') || 'none'}.
Reply ONLY as JSON array: [{"name":"...","target":8,"unit":"glasses","category":"health"}]
Categories: fitness, nutrition, learning, health, general`,
    vibeValue,
    300,
  );
  if (!result) return null;
  try {
    const jsonStr = result.match(/\[[\s\S]*\]/)?.[0];
    if (!jsonStr) return null;
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Estimate calories from meal description
 */
export async function estimateCalories(description: string, vibeValue: number = 50): Promise<number | null> {
  const result = await callAI(
    `Estimate total calories for: "${description}". Reply with ONLY a number (integer).`,
    vibeValue,
    20,
  );
  if (!result) return null;
  const num = parseInt(result.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? null : num;
}
