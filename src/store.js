// In-memory store. In production the same functions are backed by Postgres.

const users = [
  { id: 'u_1', orgId: 'org_1', role: 'member', name: 'Alice' },
  { id: 'u_2', orgId: 'org_2', role: 'member', name: 'Bob' },
  { id: 'u_3', orgId: 'org_1', role: 'admin', name: 'Carol' },
];

let campaigns = [];
let seq = 0;

export function reset() {
  campaigns = [];
  seq = 0;
}

export function findUser(id) {
  return users.find((u) => u.id === id);
}

export function listCampaigns(orgId) {
  return campaigns.filter((c) => c.orgId === orgId);
}

export function getCampaign(orgId, id) {
  return campaigns.find((c) => c.id === id && c.orgId === orgId);
}

export function createCampaign(orgId, { title }) {
  seq += 1;
  const campaign = {
    id: `c_${seq}`,
    orgId,
    title,
    createdAt: new Date().toISOString(),
  };
  campaigns.push(campaign);
  return campaign;
}
