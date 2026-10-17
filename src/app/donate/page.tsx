import { Suspense } from "react";
import { DonateForm } from "@/components/donate-form";
import { SectionTag } from "@/components/ui";

export const metadata = {
  title: "Donate surplus food — FoodBridge AI",
};

export default function DonatePage() {
  return (
    <main className="fb-grain min-h-screen bg-parchment pb-24 pt-28 md:pt-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTag>Step 01 of the rescue — reporting</SectionTag>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
          From your cooler to a community table{" "}
          <span className="italic text-clay">in under two hours.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-ink/65">
          Four quick steps. The platform screens the listing for food safety, ranks every NGO
          in the network, and alerts the best fits the instant you publish.
        </p>
      </div>
      <div className="mt-12 px-4 sm:px-6">
        <Suspense fallback={<div className="mx-auto h-96 max-w-6xl animate-pulse rounded-3xl bg-cream" />}>
          <DonateForm />
        </Suspense>
      </div>
    </main>
  );
}
