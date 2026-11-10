import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, as, createCampaign } from './helpers.js';

let app;
beforeEach(async () => { app = await startApp(); });
afterEach(async () => { await app.close(); });

test('landing page renders the campaign', async () => {
  const c = await createCampaign(app.base, 'u_1', 'Spring Webinar');
  const res = await fetch(`${app.base}/l/${c.slug}`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Spring Webinar/);
});

test('leads can be exported as CSV', async () => {
  const c = await createCampaign(app.base, 'u_1', 'Spring Webinar');
  await fetch(`${app.base}/l/${c.slug}/leads`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'name=Jane&email=jane%40example.com&company=Example',
  });
  const res = await fetch(`${app.base}/api/campaigns/${c.id}/leads.csv`, { headers: as('u_1') });
  assert.equal(res.status, 200);
  assert.match(await res.text(), /jane@example.com/);
});

test('logo can be uploaded', async () => {
  const c = await createCampaign(app.base, 'u_1', 'Spring Webinar');
  const res = await fetch(`${app.base}/api/campaigns/${c.id}/logo`, {
    method: 'PUT',
    headers: { 'x-user-id': 'u_1', 'content-type': 'image/svg+xml' },
    body: '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>',
  });
  assert.equal(res.status, 204);
});
