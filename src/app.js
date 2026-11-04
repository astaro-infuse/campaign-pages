import express from 'express';
import * as store from './store.js';

export function createApp() {
  const app = express();
  app.use(express.json());

  // Simplified auth: the API gateway sets x-user-id.
  function auth(req, res, next) {
    const user = store.findUser(req.get('x-user-id'));
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    req.user = user;
    next();
  }

  app.get('/api/campaigns', auth, (req, res) => {
    res.json(store.listCampaigns(req.user.orgId));
  });

  app.get('/api/campaigns/:id', auth, (req, res) => {
    const campaign = store.getCampaign(req.user.orgId, req.params.id);
    if (!campaign) return res.status(404).json({ error: 'not found' });
    res.json(campaign);
  });

  app.post('/api/campaigns', auth, (req, res) => {
    const title = String(req.body?.title ?? '').trim();
    if (!title || title.length > 120) {
      return res.status(400).json({ error: 'title is required, max 120 characters' });
    }
    res.status(201).json(store.createCampaign(req.user.orgId, { title }));
  });

  return app;
}
