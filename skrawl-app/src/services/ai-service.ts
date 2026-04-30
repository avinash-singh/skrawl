/**
 * AI Service — Claude API integration for Skrawl.
 *
 * Two ways to connect:
 * 1. API Key — paste directly from console.anthropic.com
 * 2. Sign in with Anthropic — opens browser to authenticate via SSO/OAuth,
 *    user creates key in console, pastes back
 *
 * Uses Claude Haiku 4.5 (cheapest, fastest) for all operations.
 * Free tier: $5 credit on signup at anthropic.com
 */

import * as WebBrowser from 'expo-web-browser';

const API_URL = 'https://api.anthropic.com/v1/messages';

let _apiKey: string | null = null;
let _sessionActive = false;

// ===== Key Management =====

export function getApiKey(): string | null {
  return _apiKey;
}

export function setApiKey(key: string): void {
  _apiKey = key.trim();
  _sessionActive = true;
}

export function clearApiKey(): void {
  _apiKey = null;
  _sessionActive = false;
}

export function isConfigured(): boolean {
  return !!_apiKey && _apiKey.length > 10;
}

export function isSessionActive(): boolean {
  return _sessionActive;
}

// ===== OAuth-style Authentication =====

/**
 * Open Anthropic console in browser for user to authenticate via SSO
 * and create/copy an API key. Returns when the browser is dismissed.
 */
export async function openAnthropicAuth(): Promise<void> {
  await WebBrowser.openBrowserAsync('https://console.anthropic.com/settings/keys', {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
    controlsColor: '#7C6AFF',
  });
}

/**
 * Open Anthropic signup page for new users
 */
export async function openAnthropicSignup(): Promise<void> {
  await WebBrowser.openBrowserAsync('https://console.anthropic.com/', {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
    controlsColor: '#7C6AFF',
  });
}

/**
 * Verify an API key works by making a minimal test call
 */
export async function verifyApiKey(key: string): Promise<boolean> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ===== Claude API Calls =====

async function callClaude(prompt: string, maxTokens: number = 200): Promise<string | null> {
  if (!_apiKey) return null;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': _apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.content?.[0]?.text || null;
  } catch {
    return null;
  }
}

/**
 * Suggest folder + priority for a note based on title
 */
export async function suggestCategorization(
  title: string,
  folders: { id: string; name: string }[],
): Promise<{ folderId: string | null; priority: number | null } | null> {
  const folderList = folders.map((f) => f.name).join(', ');
  const result = await callClaude(
    `Given this note title: "${title}"
Available folders: ${folderList || 'none'}
Suggest the best folder name (or "none") and priority level (0=critical, 1=high, 2=medium, 3=low, null=unset).
Reply ONLY as JSON: {"folder":"name","priority":1}`,
    100,
  );

  if (!result) return null;
  try {
    const parsed = JSON.parse(result);
    const folder = folders.find((f) => f.name.toLowerCase() === parsed.folder?.toLowerCase());
    return { folderId: folder?.id || null, priority: typeof parsed.priority === 'number' ? parsed.priority : null };
  } catch {
    return null;
  }
}

/**
 * Generate a title from body text
 */
export async function generateTitle(body: string): Promise<string | null> {
  return callClaude(
    `Generate a concise title (max 8 words) for this note. Reply with ONLY the title, no quotes:\n\n${body.substring(0, 500)}`,
    50,
  );
}

/**
 * Suggest goals based on existing ones
 */
export async function suggestGoals(
  existingGoals: string[],
): Promise<{ name: string; target: number; unit: string; category: string }[] | null> {
  const result = await callClaude(
    `Suggest 3 personal improvement goals. Existing: ${existingGoals.join(', ') || 'none'}.
Reply ONLY as JSON array: [{"name":"...","target":8,"unit":"glasses","category":"health"}]
Categories: fitness, nutrition, learning, health, general`,
    300,
  );
  if (!result) return null;
  try { return JSON.parse(result); } catch { return null; }
}

/**
 * Estimate calories from meal description
 */
export async function estimateCalories(description: string): Promise<number | null> {
  const result = await callClaude(
    `Estimate total calories for: "${description}". Reply with ONLY a number.`,
    20,
  );
  if (!result) return null;
  const num = parseInt(result.trim(), 10);
  return isNaN(num) ? null : num;
}
