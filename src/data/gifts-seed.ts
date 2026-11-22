export interface GiftSeed {
  dayNumber: number;
  title: string;
  description: string;
  imageSvg: string;
}

const giftTitles = [
  "Ciepły początek",
  "Zimowa chwila",
  "Mała przyjemność",
  "Świąteczny aromat",
  "Wieczór w blasku świec",
  "Leśna niespodzianka",
  "Coś słodkiego",
  "Miękki odpoczynek",
  "Złota iskierka",
  "Czas dla siebie",
  "Zimowe wspomnienie",
  "Świąteczna melodia",
  "Odrobina magii",
  "Przytulny wieczór",
  "Mały skarb",
  "Zapach grudnia",
  "Chwila zachwytu",
  "Ciepłe światło",
  "Radosna niespodzianka",
  "Świąteczny drobiazg",
  "Spokojny poranek",
  "Zimowa opowieść",
  "Bliskość świąt",
  "Wigilia",
];

function createPlaceholderSvg(dayNumber: number): string {
  const dayLabel = dayNumber.toString().padStart(2, "0");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" role="img" aria-label="Placeholder prezentu ${dayLabel}">
  <rect width="240" height="320" rx="20" fill="#0B1D16"/>
  <path d="M24 24h192v272H24z" fill="none" stroke="#C5A059" stroke-opacity=".55" stroke-width="2"/>
  <circle cx="120" cy="112" r="52" fill="none" stroke="#C5A059" stroke-opacity=".7" stroke-width="2"/>
  <path d="M120 77v70m-35-35h70" stroke="#C5A059" stroke-linecap="round" stroke-width="3"/>
  <text x="120" y="226" fill="#F5F0E6" font-family="Georgia,serif" font-size="38" text-anchor="middle">${dayLabel}</text>
  <text x="120" y="257" fill="#C5A059" font-family="Arial,sans-serif" font-size="11" letter-spacing="3" text-anchor="middle">GRUDNIA</text>
</svg>`;
}

export const giftsSeed: GiftSeed[] = giftTitles.map((title, index) => {
  const dayNumber = index + 1;

  return {
    dayNumber,
    title,
    description: "Tymczasowy opis prezentu — podmień go, gdy treść będzie gotowa.",
    imageSvg: createPlaceholderSvg(dayNumber),
  };
});
