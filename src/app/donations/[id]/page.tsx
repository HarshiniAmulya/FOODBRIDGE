import { Suspense } from "react";
import { RescueDetail } from "@/components/rescue-detail";

export const metadata = { title: "Rescue detail — FoodBridge AI" };

export default function DonationDetailPage() {
  return (
    <main className="fb-grain min-h-screen bg-parchment pb-24 pt-28 md:pt-32">
      <Suspense
        fallback={
          <div className="mx-auto h-[60vh] max-w-6xl animate-pulse px-4">
            <div className="h-full rounded-3xl bg-cream" />
          </div>
        }
      >
        <RescueDetail />
      </Suspense>
    </main>
  );
}
