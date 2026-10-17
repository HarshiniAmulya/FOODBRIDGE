import { Landing } from "@/components/landing";

export default function HomePage() {
  return (
    <>
      <Landing />
      <footer className="border-t border-ink/10 bg-parchment px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-ink/55">
          <p className="font-display text-base font-semibold text-ink">
            FoodBridge<span className="italic text-clay">·AI</span>{" "}
            <span className="ml-2 font-sans text-xs font-normal text-ink/55">
              Rescue Surplus. Redistribute Hope.
            </span>
          </p>
          <p className="text-xs">
            Built for Hackfest · Rule-based matching prototype · Photos: Pexels · Maps © OpenStreetMap, CARTO
          </p>
        </div>
      </footer>
    </>
  );
}
