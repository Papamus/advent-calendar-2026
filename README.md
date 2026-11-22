# Kalendarz Adwentowy 2026

Fundament aplikacji kalendarza adwentowego w Next.js (App Router), TypeScript,
Tailwind CSS i Supabase.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Wymagane sekrety Supabase i pozostałe zmienne środowiskowe należy ustawić w
lokalnym pliku `.env.local`; nie należy go commitować.

## Weryfikacja

```bash
npm run typecheck
npm run test:smoke
npm run build
```

Migracja początkowego schematu znajduje się w
`supabase/migrations/001_init_advent_calendar.sql`. Placeholdery treści są
odizolowane w `src/data/gifts-seed.ts`.
