import { Suspense } from "react";
import { MagicLinkVerification } from "@/components/MagicLinkVerification";

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
