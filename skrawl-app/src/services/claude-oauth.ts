/**
 * Claude OAuth2 PKCE flow — authenticate with Claude account (SSO/email/Google)
 * and get an API key scoped to Skrawl.
 *
 * Uses the same OAuth endpoint as Claude Code.
 */

import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';

const CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';
const AUTHORIZE_URL = 'https://claude.com/cai/oauth/authorize';
const TOKEN_URL = 'https://claude.com/cai/oauth/token';
const REDIRECT_URI = 'https://platform.claude.com/oauth/code/callback';
const SCOPES = 'org:create_api_key user:profile user:inference';

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = new Uint8Array(length);
  globalThis.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
  return base64UrlEncode(hash);
}

let _codeVerifier: string | null = null;

/**
 * Start the OAuth flow — opens Claude login in browser.
 * Returns the auth code if successful, null if cancelled.
 */
export async function startOAuthFlow(): Promise<string | null> {
  _codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(_codeVerifier);
  const state = generateRandomString(32);

  const params = new URLSearchParams({
    code: 'true',
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
  });

  const authUrl = `${AUTHORIZE_URL}?${params.toString()}`;

  // Open in-app browser — user authenticates via SSO/Google/email
  const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

  if (result.type === 'success' && result.url) {
    const url = new URL(result.url);
    return url.searchParams.get('code');
  }

  return null;
}

/**
 * Exchange auth code for API key
 */
export async function exchangeCodeForKey(code: string): Promise<string | null> {
  if (!_codeVerifier) return null;

  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: _codeVerifier,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.api_key || data.access_token || null;
  } catch {
    return null;
  } finally {
    _codeVerifier = null;
  }
}
