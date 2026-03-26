import { ensureRegistered, getToken } from './auth';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  await ensureRegistered();
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error || `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

export function getPlayer() {
  return request('/api/player');
}

export function getCollection() {
  return request('/api/collection');
}

export function initCollection() {
  return request('/api/collection/init', { method: 'POST' });
}

export function getShop() {
  return request('/api/shop');
}

export function buyChicken(listingId, name) {
  return request('/api/shop/buy-chicken', {
    method: 'POST',
    body: JSON.stringify({ listingId, name }),
  });
}

export function buyFeed(feedKey, quantity = 1) {
  return request('/api/shop/buy-feed', {
    method: 'POST',
    body: JSON.stringify({ feedKey, quantity }),
  });
}

export function createMatch(chickenIds, gameModeId) {
  return request('/api/match/create', {
    method: 'POST',
    body: JSON.stringify({ chickenIds, gameModeId }),
  });
}
