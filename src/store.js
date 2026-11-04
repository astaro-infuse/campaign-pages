// In-memory store. In production the same functions are backed by Postgres.

const users = [
  { id: 'u_1', orgId: 'org_1', role: 'member', name: 'Alice' },
  { id: 'u_2', orgId: 'org_2', role: 'member', name: 'Bob' },
  { id: 'u_3', orgId: 'org_1', role: 'admin', name: 'Carol' },
];

let campaigns = [];
let leads = [];
let seq = 0;

export function reset() {
  campaigns = [];
  leads = [];
  seq = 0;
}

export function findUser(id) {
  return users.find((u) => u.id === id);
}

export function listCampaigns(orgId) {
  return campaigns.filter((c) => c.orgId === orgId);
}

export function listAllCampaigns() {
  return campaigns;
}

export function getCampaign(orgId, id) {
  return campaigns.find((c) => c.id === id && c.orgId === orgId);
}

export function getCampaignById(id) {
  return campaigns.find((c) => c.id === id);
}

export function getCampaignBySlug(slug) {
  return campaigns.find((c) => c.slug === slug);
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function createCampaign(orgId, { title }) {
  seq += 1;
  const campaign = {
    id: `c_${seq}`,
    orgId,
    title,
    slug: slugify(title),
    logoSvg: null,
    videoStatus: 'none',
    createdAt: new Date().toISOString(),
  };
  campaigns.push(campaign);
  return campaign;
}

export function updateCampaign(id, patch) {
  const campaign = getCampaignById(id);
  Object.assign(campaign, patch);
  return campaign;
}

export function addLead(campaignId, lead) {
  leads.push({ campaignId, ...lead });
}

export function listLeads(campaignId) {
  return leads.filter((l) => l.campaignId === campaignId);
}
