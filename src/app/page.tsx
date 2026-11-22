export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-12 sm:px-8 sm:py-20">
      <header className="mb-12 text-center sm:mb-16">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-[#c5a059]">
          Grudniowy czas niespodzianek
        </p>
        <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-6xl">
          Kalendarz Adwentowy
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#f5f0e6]/70 sm:text-lg">
          24 małe chwile radości. Każde okienko ma swój dzień.
        </p>
      </header>

      <section
        aria-label="Okienka kalendarza adwentowego"
        className="grid grid-cols-4 gap-3 sm:grid-cols-6 sm:gap-4 md:grid-cols-8"
      >
        {Array.from({ length: 24 }, (_, index) => {
          const dayNumber = index + 1;

          return (
            <div
              key={dayNumber}
              aria-label={`Okienko ${dayNumber}`}
              data-testid="calendar-day"
              className="flex aspect-square items-center justify-center rounded-2xl border border-[#c5a059]/30 bg-[#10271e] font-serif text-2xl text-[#c5a059] shadow-lg shadow-black/10"
            >
              {dayNumber.toString().padStart(2, "0")}
            </div>
          );
        })}
      </section>

      <p className="mt-10 text-center text-sm text-[#f5f0e6]/50">
        Cierpliwość też jest częścią magii.
      </p>
    </main>
  );
}
