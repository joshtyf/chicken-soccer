const TOKEN_KEY = 'guest_token_v1';

function readToken() {
  return globalThis.localStorage?.getItem(TOKEN_KEY) || '';
}

function writeToken(token) {
  if (!token) return;
  globalThis.localStorage?.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return readToken();
}

export function hasToken() {
  return Boolean(readToken());
}

export async function register() {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to register guest player');
  }

  const data = await response.json();
  if (!data?.token) {
    throw new Error('Server did not return an auth token');
  }

  writeToken(data.token);
  return data;
}

export async function ensureRegistered() {
  if (hasToken()) return getToken();
  const data = await register();
  return data.token;
}
