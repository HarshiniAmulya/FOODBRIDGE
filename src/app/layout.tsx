import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { PersonaProvider } from "@/components/persona";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "FoodBridge AI — Rescue Surplus. Redistribute Hope.",
  description:
    "A smart surplus food rescue and redistribution platform connecting donors, NGOs, volunteers and communities through urgency-aware matching and measurable impact.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-cream font-sans text-ink antialiased">
        <PersonaProvider>
          <Nav />
          {children}
        </PersonaProvider>
      </body>
    </html>
  );
}
