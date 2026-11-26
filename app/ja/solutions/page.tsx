import type { Metadata } from "next";
import { OurSolutionJa } from "../../components/our-solution-ja";
import { publicSolutionMarketForPage } from "../../../lib/our-solution/market";
import { unavailableSolutionMarket } from "../../components/market-solution-preview";
import { UnifiedPageRoute } from "../../components/unified-page-route";
import { loadSolutionView } from "../../../server/our-solution/public-view";


export const metadata: Metadata = {
  title: "ソリューション | PV Circonomy",
  description: "太陽光パネル所有者、リサイクル事業者、再生材料パートナーをつなぐ循環型ソリューション。",
  alternates: {
    canonical: "/ja/solutions/",
    languages: { "en-US": "/solutions/", "ja-JP": "/ja/solutions/", "zh-TW": "/zh/solutions/" },
  },
};

export const dynamic = "force-dynamic";

export default async function SolutionsPage({ searchParams }: {
  searchParams: Promise<{ market?: string | string[] }>;
}) {
  const market = publicSolutionMarketForPage((await searchParams).market, "ja-JP");
  const view = await loadSolutionView(market, "ja-JP");
  if (!view) return <UnifiedPageRoute {...unavailableSolutionMarket(market, "ja-JP")} />;

  return <div lang="ja"><OurSolutionJa key={market} {...view} /></div>;
}
