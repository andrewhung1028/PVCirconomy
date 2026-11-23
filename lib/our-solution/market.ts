export const ourSolutionMarkets = ["US", "JP"] as const;
export type OurSolutionMarket = typeof ourSolutionMarkets[number];

export function ourSolutionMarket(value: unknown): OurSolutionMarket {
  return value === "JP" ? "JP" : "US";
}

export function assertOurSolutionMarketRegion(market: OurSolutionMarket, regionCode: unknown): asserts regionCode is string {
  const normalized = typeof regionCode === "string" ? regionCode.trim().toUpperCase() : "";
  if (market === "JP" && normalized !== "JP") {
    throw Error(`目標市場 JP 與 Scenario.region_code "${String(regionCode)}" 不符；market=JP 必須使用 "JP"。`);
  }
  if (market === "US" && normalized === "JP") {
    throw Error('目標市場 US 不接受 Scenario.region_code "JP"；請切換至「日本參數」後再上傳。');
  }
}
