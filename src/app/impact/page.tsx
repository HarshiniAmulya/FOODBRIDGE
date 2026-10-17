import { Suspense } from "react";
import { ImpactDashboard } from "@/components/impact-dashboard";
import { SectionTag } from "@/components/ui";

export const metadata = { title: "Impact Dashboard — FoodBridge AI" };

export default function ImpactPage() {
  return (
    <main className="fb-grain min-h-screen bg-parchment pb-24 pt-28 md:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTag>Step 06 of the rescue — measured outcome</SectionTag>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
          Impact, in <span className="italic text-clay">numbers.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-ink/65">
          Quantities collected, deliveries completed, and the ones that got away — computed
          live from every claim, pickup and drop-off in the network.
        </p>
      </div>
      <div className="mt-12">
        <Suspense fallback={<div className="mx-auto h-[70vh] max-w-7xl animate-pulse px-4"><div className="h-full rounded-3xl bg-cream" /></div>}>
          <ImpactDashboard />
        </Suspense>
      </div>
    </main>
  );
}
