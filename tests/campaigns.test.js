import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, as, createCampaign } from './helpers.js';

let app;
beforeEach(async () => { app = await startApp(); });
afterEach(async () => { await app.close(); });

test('requires a known user', async () => {
  const res = await fetch(`${app.base}/api/campaigns`);
  assert.equal(res.status, 401);
});

test('lists only campaigns of the user organisation', async () => {
  await createCampaign(app.base, 'u_1', 'Acme spring');
  await createCampaign(app.base, 'u_2', 'Globex spring');
  const res = await fetch(`${app.base}/api/campaigns`, { headers: as('u_1') });
  const list = await res.json();
  assert.deepEqual(list.map((c) => c.title), ['Acme spring']);
});

test('another organisation campaign is not found', async () => {
  const c = await createCampaign(app.base, 'u_1', 'Acme spring');
  const res = await fetch(`${app.base}/api/campaigns/${c.id}`, { headers: as('u_2') });
  assert.equal(res.status, 404);
});

test('validates the title', async () => {
  const res = await fetch(`${app.base}/api/campaigns`, {
    method: 'POST',
    headers: as('u_1'),
    body: JSON.stringify({ title: '' }),
  });
  assert.equal(res.status, 400);
});
