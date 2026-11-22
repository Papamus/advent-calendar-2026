# Konstytucja Projektu: Spersonalizowany Kalendarz Adwentowy (1–24 Grudnia)

## 1. Cel i Ograniczenia Biznesowe
- Aplikacja webowa (RWD: mobile + desktop) dedykowana wyłącznie **jednemu użytkownikowi** (`ALLOWED_RECIPIENT_EMAIL`).
- Budżet infrastruktury: **0 PLN** (wyłącznie darmowe plany: Vercel Hobby, Supabase Free, Resend Free, GitHub Free).
- Styl wizualny: **Cozy Dark Festive** — głębokie, przytulne ciemne tła (leśna zieleń `#0B1D16`, nocny granat `#0A111F`), ciepłe przygaszone złoto (`#C5A059`) oraz kremowa typografia (`#F5F0E6`). Zakaz używania jaskrawych, neonowych kolorów.

## 2. Stack Technologiczny
- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion.
- **Baza danych i pliki:** Supabase (PostgreSQL + prywatny bucket `gifts` w Storage).
- **E-mail:** Resend API.
- **Hosting i Cron:** Vercel + Vercel Cron Jobs.
- **Testy E2E:** Playwright.

## 3. Bezwzględne Reguły Bezpieczeństwa i Logiki
- **Walidacja daty wyłącznie po stronie serwera:** Wszystkie sprawdzenia daty odbywają się na backendzie w strefie czasowej `Europe/Warsaw`. Nigdy nie ufaj zegarowi przeglądarki.
- **Strict Data Gating:** Endpoint listy dni zwraca wyłącznie numer dnia (1–24) oraz status (`locked`, `ready`, `opened`). Opis prezentu i jego grafika są udostępniane dopiero po kliknięciu okienka i pozytywnej weryfikacji daty na serwerze.
- **Ochrona obrazków:** Obrazki serwowane są wyłącznie przez autoryzowany proxy-endpoint `/api/gifts/[day]/image` (nigdy przez publiczne URL-e).
- **Autoryzacja Magic Link:** Jednorazowy token w linku wymaga potwierdzenia żądaniem `POST` na stronie (ochrona przed skanerami poczty), po czym ustawia zaszyfrowane ciasteczko `HttpOnly; Secure; SameSite=Strict` na 30 dni.
- **Powiadomienia e-mail:**
  - `00:00` (`Europe/Warsaw`): powiadomienie o odblokowaniu nowego prezentu.
  - `17:00` (`Europe/Warsaw`): przypomnienie wysyłane **warunkowo** — wyłącznie jeśli pole `opened_at` dla bieżącego dnia w bazie ma wartość `NULL`.

## 4. Workflow GitHub
- Nigdy nie commituj bezpośrednio do gałęzi `main`.
- Każdą zmianę realizuj na dedykowanej gałęzi (`feat/...`, `fix/...`, `chore/...`) i przygotuj pod Pull Request.