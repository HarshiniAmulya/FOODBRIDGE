import { Suspense } from "react";
import { RescueBoard } from "@/components/rescue-board";
import { SectionTag } from "@/components/ui";

export const metadata = { title: "Rescue Board — FoodBridge AI" };

export default function DonationsPage() {
  return (
    <main className="fb-grain min-h-screen bg-parchment pb-24 pt-28 md:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionTag>Live operations</SectionTag>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-none tracking-tight md:text-6xl">
              The rescue <span className="italic text-clay">board.</span>
            </h1>
            <p className="mt-3 max-w-xl text-ink/65">
              Every live listing in the network — ranked by urgency. Claim a rescue, then
              coordinate pickup to delivery.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-10">
        <Suspense fallback={<div className="mx-auto h-96 max-w-7xl animate-pulse rounded-3xl bg-cream px-4" />}>
          <RescueBoard />
        </Suspense>
      </div>
    </main>
  );
}
