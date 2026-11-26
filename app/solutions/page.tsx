import type { Metadata } from "next";
import { OurSolution } from "../components/our-solution";
import { publicSolutionMarketForPage } from "../../lib/our-solution/market";
import { unavailableSolutionMarket } from "../components/market-solution-preview";
import { UnifiedPageRoute } from "../components/unified-page-route";
import { loadSolutionView } from "../../server/our-solution/public-view";

export const metadata:Metadata={title:'Our Solution | PV Circonomy',description:'A connected solar circularity solution for panel owners, recyclers and recovered-material partners.',alternates:{canonical:'/solutions/',languages:{'en-US':'/solutions/','ja-JP':'/ja/solutions/','zh-TW':'/zh/solutions/'}}};
export const dynamic='force-dynamic';

export default async function SolutionsPage({ searchParams }: {
  searchParams: Promise<{ market?: string | string[] }>;
}) {
  const market = publicSolutionMarketForPage((await searchParams).market, "en-US");
  const view = await loadSolutionView(market);
  if (!view) return <UnifiedPageRoute {...unavailableSolutionMarket(market, "en-US")} />;

  return <OurSolution key={market} {...view} />;
}
