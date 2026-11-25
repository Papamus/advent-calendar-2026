"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence } from "framer-motion";
import { LogOut, Mail, Sparkles } from "lucide-react";
import { AdventCalendar3D } from "@/components/AdventCalendar3D";
import { GiftRevealModal } from "@/components/GiftRevealModal";
import type {
  CalendarDayListResponse,
  OpenedGiftDetails,
} from "@/types/calendar";

type ViewState = "loading" | "unauthenticated" | "authenticated" | "error";

const neutralSignInMessage =
  "Jeśli adres jest uprawniony, link do logowania został wysłany.";

function isCalendarDayList(value: unknown): value is CalendarDayListResponse {
  if (!Array.isArray(value) || value.length !== 24) {
    return false;
  }

  return value.every((day, index) => {
    if (typeof day !== "object" || day === null) {
      return false;
    }

    const candidate = day as Record<string, unknown>;
    return (
      candidate.dayNumber === index + 1 &&
      ["locked", "ready", "opened"].includes(String(candidate.status)) &&
      Object.keys(candidate).length === 2
    );
  });
}

function isOpenedGiftDetails(value: unknown): value is OpenedGiftDetails {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    Number.isInteger(candidate.dayNumber) &&
    candidate.status === "opened" &&
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.imageUrl === "string" &&
    candidate.imageUrl.startsWith("/api/gifts/") &&
    typeof candidate.openedAt === "string"
  );
}

async function fetchCalendar(): Promise<CalendarDayListResponse | null> {
  const response = await fetch("/api/calendar", { cache: "no-store" });

  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Nie udało się pobrać kalendarza.");
  }

  const payload: unknown = await response.json();
  if (!isCalendarDayList(payload)) {
    throw new Error("Otrzymano nieprawidłowy kalendarz.");
  }

  return payload;
}

export function HomeExperience() {
  const [view, setView] = useState<ViewState>("loading");
  const [days, setDays] = useState<CalendarDayListResponse>([]);
  const [gift, setGift] = useState<OpenedGiftDetails | null>(null);
  const [openingDay, setOpeningDay] = useState<number | null>(null);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let active = true;

    void fetchCalendar()
      .then((calendar) => {
        if (!active) {
          return;
        }

        if (calendar === null) {
          setView("unauthenticated");
          return;
        }

        setDays(calendar);
        setView("authenticated");
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setPageError(
          error instanceof Error
            ? error.message
            : "Wystąpił nieoczekiwany błąd podczas wczytywania kalendarza.",
        );
        setView("error");
      });

    return () => {
      active = false;
    };
  }, []);

  async function loadCalendar() {
    setPageError("");
    setView("loading");

    try {
      const calendar = await fetchCalendar();
      if (calendar === null) {
        setView("unauthenticated");
        return;
      }

      setDays(calendar);
      setView("authenticated");
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Wystąpił nieoczekiwany błąd podczas wczytywania kalendarza.",
      );
      setView("error");
    }
  }

  function retryCalendar() {
    setPageError("");
    setView("loading");
    void loadCalendar();
  }

  async function openDay(dayNumber: number) {
    if (openingDay !== null) {
      return;
    }

    const day = days.find((item) => item.dayNumber === dayNumber);
    if (!day || day.status === "locked") {
      return;
    }

    setOpeningDay(dayNumber);
    setPageError("");

    try {
      const response = await fetch(`/api/calendar/${dayNumber}/open`, {
        method: "POST",
      });

      if (response.status === 403) {
        throw new Error("To okienko nie jest jeszcze dostępne.");
      }
      if (!response.ok) {
        throw new Error("Nie udało się otworzyć tego okienka.");
      }

      const payload: unknown = await response.json();
      if (!isOpenedGiftDetails(payload) || payload.dayNumber !== dayNumber) {
        throw new Error("Otrzymano nieprawidłowe dane prezentu.");
      }

      setDays((currentDays) =>
        currentDays.map((item) =>
          item.dayNumber === dayNumber
            ? { ...item, status: "opened" }
            : item,
        ),
      );

      if (day.status === "ready") {
        await new Promise((resolve) => window.setTimeout(resolve, 850));
      }

      setGift(payload);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Nie udało się otworzyć tego okienka.",
      );
    } finally {
      setOpeningDay(null);
    }
  }

  async function logout() {
    setPageError("");

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Nie udało się bezpiecznie wylogować.");
      }

      setGift(null);
      setDays([]);
      setView("unauthenticated");
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Nie udało się wylogować.",
      );
    }
  }

  return (
    <main className="calendar-shell">
      {view === "authenticated" ? (
        <>
          <header className="calendar-header">
            <div className="calendar-header-copy">
              <p className="eyebrow">
                <Sparkles aria-hidden="true" size={14} />
                Grudniowy czas niespodzianek
              </p>
              <h1>Kalendarz Adwentowy</h1>
              <p className="calendar-intro">
                24 małe chwile radości. Odkrywaj je we własnym, spokojnym rytmie.
              </p>
            </div>
            <button
              className="logout-button"
              onClick={logout}
              type="button"
              aria-label="Wyloguj się"
            >
              <LogOut aria-hidden="true" size={16} />
              <span>Wyloguj</span>
            </button>
          </header>

          <section
            aria-label="Okienka kalendarza adwentowego"
            className="calendar-display"
          >
            <AdventCalendar3D
              days={days}
              openingDay={openingDay}
              onOpenDay={openDay}
            />
          </section>
          <p className="calendar-footnote" aria-live="polite">
            {pageError || "Cierpliwość też jest częścią magii."}
          </p>
          <AnimatePresence>
            {gift ? (
              <GiftRevealModal gift={gift} onClose={() => setGift(null)} />
            ) : null}
          </AnimatePresence>
        </>
      ) : view === "unauthenticated" ? (
        <section className="entry-card" aria-labelledby="entry-heading">
          <div className="entry-emblem" aria-hidden="true">
            <Sparkles size={25} />
          </div>
          <p className="eyebrow">Tylko dla Ciebie</p>
          <h1 id="entry-heading">Otwórz drzwi do grudniowej magii</h1>
          <p className="entry-description">
            Podaj swój adres e-mail, a wyślemy Ci bezpieczny link do kalendarza.
          </p>
          <SignInForm />
          {pageError ? (
            <p className="form-message form-message--error" role="alert">
              {pageError}
            </p>
          ) : null}
          <p className="entry-note">24 dni. Jedna wyjątkowa niespodzianka.</p>
        </section>
      ) : view === "error" ? (
        <section className="entry-card" aria-labelledby="error-heading">
          <p className="eyebrow">Chwila przerwy</p>
          <h1 id="error-heading">Nie udało się wczytać kalendarza</h1>
          <p className="form-message form-message--error" role="alert">
            {pageError}
          </p>
          <button className="gold-button" onClick={retryCalendar} type="button">
            Spróbuj ponownie
          </button>
        </section>
      ) : (
        <section
          className="loading-card"
          aria-label="Wczytywanie kalendarza"
          aria-busy="true"
        >
          <span className="loading-orbit" aria-hidden="true" />
          <p>Rozpalamy świąteczne światła…</p>
        </section>
      )}
    </main>
  );
}

function SignInForm() {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setMessage("");

    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    try {
      const response = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Nie udało się wysłać linku. Spróbuj ponownie.");
      }

      setMessage(neutralSignInMessage);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nie udało się wysłać linku. Spróbuj ponownie.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="sign-in-form" onSubmit={handleSubmit}>
      <label htmlFor="email-address">Adres e-mail</label>
      <div className="email-field">
        <Mail aria-hidden="true" size={18} />
        <input
          autoComplete="email"
          id="email-address"
          name="email"
          placeholder="ty@przyklad.pl"
          required
          type="email"
        />
      </div>
      <button className="gold-button" disabled={isPending} type="submit">
        {isPending ? "Wysyłanie…" : "Wyślij link do logowania"}
      </button>
      {message ? (
        <p
          className={
            message === neutralSignInMessage
              ? "form-message"
              : "form-message form-message--error"
          }
          role={message === neutralSignInMessage ? "status" : "alert"}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
