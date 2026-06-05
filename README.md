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
