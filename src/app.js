import express from 'express';
import * as store from './store.js';
import { generateVideo } from './videoClient.js';

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
    // all=true is used by the admin dashboard
    if (req.query.all === 'true') {
      return res.json(store.listAllCampaigns());
    }
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

  // Logo upload: raw SVG in the request body
  app.put(
    '/api/campaigns/:id/logo',
    auth,
    express.text({ type: 'image/svg+xml', limit: '1mb' }),
    (req, res) => {
      const campaign = store.getCampaign(req.user.orgId, req.params.id);
      if (!campaign) return res.status(404).json({ error: 'not found' });
      if (typeof req.body !== 'string' || !req.body.includes('<svg')) {
        return res.status(400).json({ error: 'SVG expected' });
      }
      store.updateCampaign(campaign.id, { logoSvg: req.body });
      res.status(204).end();
    },
  );

  // Export leads as CSV
  app.get('/api/campaigns/:id/leads.csv', auth, (req, res) => {
    const campaign = store.getCampaignById(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'not found' });
    const rows = store.listLeads(campaign.id).map((l) => `${l.name},${l.email},${l.company}`);
    res.type('text/csv').send(['name,email,company', ...rows].join('\n'));
  });

  // Generate a personalised video for the campaign
  app.post('/api/campaigns/:id/video', auth, async (req, res) => {
    const campaign = store.getCampaign(req.user.orgId, req.params.id);
    if (!campaign) return res.status(404).json({ error: 'not found' });
    try {
      const video = await generateVideo(campaign);
      store.updateCampaign(campaign.id, { videoStatus: 'ready', videoUrl: video.url });
      res.json({ status: 'ready', url: video.url });
    } catch (err) {
      store.updateCampaign(campaign.id, { videoStatus: 'failed' });
      res.status(500).json({ error: err.message });
    }
  });

  // Public landing page, no auth
  app.get('/l/:slug', (req, res) => {
    const campaign = store.getCampaignBySlug(req.params.slug);
    if (!campaign) return res.status(404).send('Not found');
    res.type('html').send(`<!doctype html>
<html>
  <head><meta charset="utf-8"><title>${campaign.title}</title></head>
  <body>
    <div class="logo">${campaign.logoSvg ?? ''}</div>
    <h1>${campaign.title}</h1>
    <form method="post" action="/l/${campaign.slug}/leads">
      <input name="name" placeholder="Name">
      <input name="email" placeholder="Work email">
      <input name="company" placeholder="Company">
      <button>Get the report</button>
    </form>
  </body>
</html>`);
  });

  // Public lead form submit
  app.post('/l/:slug/leads', express.urlencoded({ extended: false }), (req, res) => {
    const campaign = store.getCampaignBySlug(req.params.slug);
    if (!campaign) return res.status(404).send('Not found');
    const lead = {
      name: req.body.name,
      email: req.body.email,
      company: req.body.company,
      createdAt: new Date().toISOString(),
    };
    console.log('New lead captured', lead);
    store.addLead(campaign.id, lead);
    res.type('html').send('<p>Thank you! The report is on its way.</p>');
  });

  return app;
}
