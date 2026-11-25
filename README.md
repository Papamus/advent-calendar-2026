# Kalendarz Adwentowy 2026

Fundament aplikacji kalendarza adwentowego w Next.js (App Router), TypeScript,
Tailwind CSS i Supabase.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Wymagane sekrety i pozostałe zmienne środowiskowe należy ustawić w
lokalnym pliku `.env.local`; nie należy go commitować.
Backend wymaga `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`AUTH_SECRET` (minimum 32 bajty), `ALLOWED_RECIPIENT_EMAIL`, `APP_URL`,
`RESEND_API_KEY`, `RESEND_FROM_EMAIL` (zweryfikowany nadawca Resend) oraz
`CRON_SECRET`.

## Weryfikacja

```bash
npm run typecheck
npm run test:smoke
npm audit --audit-level=high
node .github/scripts/security-quality-gate.mjs
node --test .github/scripts/security-quality-gate.test.mjs
npm run build
```

## Backend

Zastosuj wszystkie migracje `supabase/migrations/` w kolejności; tworzą one
schemat, prywatny bucket `gifts` oraz atomowe ustawianie `opened_at`.
`POST /api/auth/request-link` wysyła jednorazowy link, a strona potwierdzenia
powinna wymienić go przez `POST /api/auth/verify`. Endpointy kalendarza i
obrazków wymagają ciasteczka sesyjnego. Cron Vercel wywołuje
`/api/cron/notifications`; ustaw `CRON_SECRET` w ustawieniach projektu Vercel.
Harmonogram `vercel.json` jest podany w UTC dla czasu CET.

Placeholdery treści są odizolowane w `src/data/gifts-seed.ts`. Workflow Pull
Requestów uruchamia deterministyczną bramkę bezpieczeństwa i jakości bez
wysyłania kodu do zewnętrznych usług AI.

## Frontend

Strona `/` rozpoczyna od `GET /api/calendar`: odpowiedź `401` pokazuje formularz
Magic Link, a autoryzowana odpowiedź renderuje 24 okienka wyłącznie na podstawie
serwerowych statusów. Otwieranie dnia korzysta z `POST /api/calendar/[day]/open`;
szczegóły prezentu i obraz są pobierane dopiero po potwierdzonym otwarciu.
`/auth/verify` potwierdza token żądaniem `POST`, a kalendarz 3D ma statyczny
fallback, gdy przeglądarka nie obsługuje WebGL. Logika dostępności dni nie
korzysta z zegara przeglądarki.
