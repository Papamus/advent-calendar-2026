import { Suspense } from "react";
import type { Metadata } from "next";
import { MagicLinkVerification } from "@/components/MagicLinkVerification";

export const metadata: Metadata = {
  referrer: "no-referrer",
};

function VerificationFallback() {
  return (
    <main className="calendar-shell">
      <section className="loading-card" aria-busy="true">
        <span className="loading-orbit" aria-hidden="true" />
        <p>Sprawdzamy link…</p>
      </section>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerificationFallback />}>
      <MagicLinkVerification />
    </Suspense>
  );
}
