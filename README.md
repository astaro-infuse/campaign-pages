# campaign-pages

Small service for marketing campaigns. Each user belongs to an organisation and sees only its own campaigns.

Data is kept in memory (`src/store.js`); in production the same interface sits on Postgres.
Auth is simplified: the API gateway puts the user id into the `x-user-id` header. Demo users: `u_1` (Acme, member), `u_2` (Globex, member), `u_3` (Acme, admin).

## Run

Node.js 20+.

```
npm install
npm test
npm start      # http://localhost:3000
```

## API

| Method | Path | |
|---|---|---|
| GET | `/api/campaigns` | Campaigns of the user's organisation |
| GET | `/api/campaigns/:id` | One campaign |
| POST | `/api/campaigns` | Create: `{ "title": "..." }` |

## WordPress plugin

`wordpress/campaign-leads` — plugin for the marketing site (WordPress Multisite, one site per region).

- `[campaign_landing campaign="black-friday" title="Black Friday"]` — landing block with a lead form
- **Campaign Leads** page in wp-admin: leads list, delete, CSV export
- every new lead is sent to the CRM
- `GET /wp-json/campaign-leads/v1/leads?campaign=black-friday` — last 10 leads for the dashboard widget (`src/LatestLeads.jsx`)
