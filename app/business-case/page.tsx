import { publicSolutionMarketForPage } from "../../lib/our-solution/market";
import Calculator from "./calculator";
import localFont from "next/font/local";
import { loadMasterData } from "../../lib/business-case/master-data";
import "./calculator.css";

export const dynamic = "force-dynamic";
const manrope = localFont({ src: "../../public/fonts/Manrope-Variable.ttf", weight: "300 800", display: "swap" });

export default async function Page({ searchParams }: {
  searchParams: Promise<{ market?: string; region?: string; fee?: string; compare?: string; panelsPerMonth?: string | string[] }>;
}) {
  const [data, { region, market, panelsPerMonth, fee, compare }] = await Promise.all([loadMasterData(), searchParams]);
  return <div className={manrope.className}><div className="bc-calculator"><Calculator key={JSON.stringify([market, region, panelsPerMonth, fee, compare])} sourceLabel={data.source} initialFee={fee} initialComparison={compare} initialRegion={region} initialMonthlyVolume={typeof panelsPerMonth === "string" ? panelsPerMonth : undefined} requestedMarket={market || !region ? publicSolutionMarketForPage(market, "en-US") : undefined} /></div></div>;
}
