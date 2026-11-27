import type { Metadata } from "next";
import Calculator from "../../business-case/calculator";
import { loadMasterData } from "../../../lib/business-case/master-data";
import { publicSolutionMarketForPage } from "../../../lib/our-solution/market";
import "../../business-case/calculator.css";

export const metadata: Metadata = {
  title: "營運試算 | PV Circonomy",
  description: "依據當地條件比較太陽能板回收成本、年度 EBITDA 及投資回收期。",
  alternates: { canonical: "/zh/business-case/", languages: {
    "en-US": "/business-case/", "ja-JP": "/ja/business-case/", "zh-TW": "/zh/business-case/",
  } },
};

export const dynamic = "force-dynamic";

export default async function ChineseBusinessCasePage({ searchParams }: {
  searchParams: Promise<{ market?: string; region?: string; fee?: string; compare?: string; panelsPerMonth?: string | string[] }>;
}) {
  const [data, { market, region, panelsPerMonth, fee, compare }] = await Promise.all([loadMasterData(), searchParams]);
  return <div className="pv-traditional-chinese" lang="zh-TW">
    <div className="bc-calculator bc-calculator-ja">
      <Calculator key={JSON.stringify([market, region, panelsPerMonth, fee, compare])} sourceLabel={data.source} initialFee={fee} initialComparison={compare} locale="zh-TW" initialRegion={region} initialMonthlyVolume={typeof panelsPerMonth === "string" ? panelsPerMonth : undefined} requestedMarket={market || !region ? publicSolutionMarketForPage(market, "zh-TW") : undefined} />
    </div>
  </div>;
}
