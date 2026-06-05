# Technology Team OKR Manager

Internal OKR management tool for a 16-person Technology team.

## Stack

- React + TypeScript
- Tailwind CSS
- Zustand (with localStorage persistence)
- Vite

## Development

```bash
npm install
npm run dev
```

Run two terminals:

```bash
npm run dev:worker   # local API + D1 on http://localhost:8787
npm run dev          # Vite on http://localhost:5173 (proxies /api to the worker)
```

Open [http://localhost:5173](http://localhost:5173).

Local dev uses a **separate D1 database**. Production accounts are not copied automatically. After migrations, sync users once:

```bash
npm run users:sync
```

Use the same email and password as production. To create a new account manually:

```bash
node scripts/create-admin.mjs you@example.com "password" "Your Name"
npx wrangler d1 execute tech-okr-db --local --file=scripts/.admin-insert.sql
```

To hit the deployed API instead of the local worker:

```bash
VITE_API_PROXY_TARGET=https://tech-okr-manager.steven-walsh39.workers.dev npm run dev
```

## Build

```bash
npm run build
```

## Project structure

```
src/
  types/        # Core data model
  store/        # Zustand store + selectors
  utils/        # Calculations, confidence rollups, validation
  components/   # UI components and dashboard views
```

Phase 1 uses localStorage only. The store and types are structured for a future backend API.
