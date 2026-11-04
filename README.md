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
| PUT | `/api/campaigns/:id/logo` | Upload logo (SVG) |
| GET | `/api/campaigns/:id/leads.csv` | Export leads |
| POST | `/api/campaigns/:id/video` | Generate a personalised video |
| GET | `/l/:slug` | Public landing page |
| POST | `/l/:slug/leads` | Public lead form |
