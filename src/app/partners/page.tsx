import { Suspense } from "react";
import { PartnerList } from "@/components/partner-list";
import { SectionTag } from "@/components/ui";

export const metadata = { title: "The Network — FoodBridge AI" };

export default function PartnersPage() {
  return (
    <main className="fb-grain min-h-screen bg-parchment pb-24 pt-28 md:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTag>Four groups, one bridge</SectionTag>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
          The people who make{" "}
          <span className="italic text-clay">zero waste</span> possible.
        </h1>
        <p className="mt-4 max-w-2xl text-ink/65">
          Donors report the surplus, NGOs claim it, volunteers carry it, and beneficiary
          organisations serve it — every profile carries the capacity, categories and hours
          the matching engine reasons over.
        </p>
      </div>
      <div className="mt-12">
        <Suspense fallback={<div className="mx-auto h-[60vh] max-w-7xl animate-pulse rounded-3xl bg-cream" />}>
          <PartnerList />
        </Suspense>
      </div>
    </main>
  );
}
