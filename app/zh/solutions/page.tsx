import type { Metadata } from "next";
import { unavailableSolutionMarket } from "../../components/market-solution-preview";
import { UnifiedPageRoute } from "../../components/unified-page-route";
import { OurSolutionZh } from "../../components/our-solution-zh";
import { publicSolutionMarketForPage } from "../../../lib/our-solution/market";
import { loadSolutionView } from "../../../server/our-solution/public-view";


export const metadata: Metadata = {
  title: "太陽能板回收解決方案 | PV Circonomy",
  description: "了解 PV Circulator 如何逐層分離太陽能板、回收材料並追蹤回收紀錄。",
  alternates: {
    canonical: "/zh/solutions/",
    languages: { "en-US": "/solutions/", "ja-JP": "/ja/solutions/", "zh-TW": "/zh/solutions/" },
  },
};

export const dynamic = "force-dynamic";

export default async function ChineseSolutionsPage({ searchParams }: {
  searchParams: Promise<{ market?: string | string[] }>;
}) {
  const market = publicSolutionMarketForPage((await searchParams).market, "zh-TW");

  const view = await loadSolutionView(market, "zh-TW");
  if (!view) return <UnifiedPageRoute {...unavailableSolutionMarket(market, "zh-TW")} />;
  return <div lang="zh-TW"><OurSolutionZh key={market} {...view} /></div>;
}
