import { ensureRegistered, getToken } from './auth';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function createGameSocket(sessionId, handlers = {}) {
  await ensureRegistered();
  const token = encodeURIComponent(getToken());
  const derivedBase = API_BASE_URL
    ? API_BASE_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
    : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
  const url = `${derivedBase}/ws/game/${sessionId}?token=${token}`;

  const ws = new WebSocket(url);

  ws.addEventListener('open', () => handlers.onOpen?.());
  ws.addEventListener('close', (event) => handlers.onClose?.(event));
  ws.addEventListener('error', (event) => handlers.onError?.(event));
  ws.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data);
      handlers.onMessage?.(message);
    } catch {
      handlers.onError?.(new Error('Invalid websocket message payload'));
    }
  });

  return ws;
}

export function sendSocketMessage(ws, payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
}
