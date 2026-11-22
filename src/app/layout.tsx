import type { Metadata } from "next";
import type React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalendarz Adwentowy",
  description: "24 grudniowe niespodzianki czekające na właściwy dzień.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
