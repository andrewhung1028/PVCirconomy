import { publicSolutionMarketForPage } from "../../../lib/our-solution/market";
import type { Metadata } from "next";
import Calculator from "../../business-case/calculator";
import { loadMasterData } from "../../../lib/business-case/master-data";
import "../../business-case/calculator.css";


export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "事業収支シミュレーター | PV Circonomy",
  description: "太陽光パネルの処理条件を入力し、年間収支と投資回収期間を比較できます。",
  alternates: {
    canonical: "/ja/business-case/",
    languages: { "en-US": "/business-case/", "ja-JP": "/ja/business-case/" },
  },
};

export default async function Page({ searchParams }: {
  searchParams: Promise<{ market?: string; region?: string; panelsPerMonth?: string | string[] }>;
}) {
  const [data, { market, region, panelsPerMonth }] = await Promise.all([loadMasterData(), searchParams]);
  return (
    <div lang="ja">
      <div className="bc-calculator bc-calculator-ja">
        <Calculator key={JSON.stringify([market, region, panelsPerMonth])} sourceLabel={data.source} locale="ja-JP" initialRegion={region} initialMonthlyVolume={typeof panelsPerMonth === "string" ? panelsPerMonth : undefined} requestedMarket={market || !region ? publicSolutionMarketForPage(market, "ja-JP") : undefined} />
      </div>
    </div>
  );
}
