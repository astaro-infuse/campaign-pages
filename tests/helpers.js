import { once } from 'node:events';
import { createApp } from '../src/app.js';
import * as store from '../src/store.js';

export async function startApp() {
  store.reset();
  const server = createApp().listen(0);
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise((resolve) => server.close(resolve)) };
}

export function as(userId) {
  return { 'x-user-id': userId, 'content-type': 'application/json' };
}

export async function createCampaign(base, userId, title) {
  const res = await fetch(`${base}/api/campaigns`, {
    method: 'POST',
    headers: as(userId),
    body: JSON.stringify({ title }),
  });
  return res.json();
}
