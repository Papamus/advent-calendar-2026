"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoaderCircle, Sparkles } from "lucide-react";

type VerificationState = "verifying" | "success" | "error";

export function MagicLinkVerification() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const attemptedToken = useRef<string | null>(null);
  const [state, setState] = useState<VerificationState>(
    token ? "verifying" : "error",
  );

  useEffect(() => {
    if (!token) {
      return;
    }
    if (attemptedToken.current === token) {
      return;
    }

    attemptedToken.current = token;

    async function verifyToken() {
      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error("Ten link wygasł albo został już użyty.");
        }

        setState("success");
        window.setTimeout(() => router.replace("/"), 1100);
      } catch {
        setState("error");
      }
    }

    void verifyToken();
  }, [router, token]);

  return (
    <main className="calendar-shell">
      <section className="entry-card verification-card" aria-live="polite">
        <div className="entry-emblem" aria-hidden="true">
          {state === "verifying" ? (
            <LoaderCircle className="spin" size={25} />
          ) : (
            <Sparkles size={25} />
          )}
        </div>
        {state === "verifying" ? (
          <>
            <p className="eyebrow">Chwileczkę</p>
            <h1>Sprawdzamy Twój link</h1>
            <p className="entry-description">
              Potwierdzamy bezpieczny dostęp do kalendarza.
            </p>
          </>
        ) : state === "success" ? (
          <>
            <p className="eyebrow">Witaj z powrotem</p>
            <h1>Link potwierdzony</h1>
            <p className="entry-description">
              Za chwilę otworzymy Twój kalendarz.
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow">Nie udało się potwierdzić</p>
            <h1>Link jest nieaktualny</h1>
            <p className="form-message form-message--error" role="alert">
              Ten link wygasł albo został już użyty. Wróć do strony głównej, aby
              poprosić o nowy.
            </p>
            <Link className="gold-button verification-link" href="/">
              Wróć do logowania
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
