import { economicsView } from "../../lib/our-solution-data";
import { capacityTrend } from "../../lib/market-capacity";
import { capacityHistory, impactRouteMetrics, model } from "../../lib/our-solution/model";
import { scenarioPanelWeightKg, scenarioPanelWeightLb } from "../../lib/our-solution/parameters";
import { isAdditionalParameterMarket, solutionDemandMarket, type OurSolutionLocale, type PublicSolutionMarket } from "../../lib/our-solution/market";
import { initialJapanRules, initialRules } from "../../lib/pricing-rules";
import { computeRetirementWave } from "../../lib/us-retirement-wave";
import { effectiveMetalPrices } from "../metal-prices/store";
import { activePricing } from "../pricing/store";
import { activeOurSolutionDataOrSeed, activeOurSolutionParameterData } from "./store";

const retirementMarkets = ["World", "Europe", "United States", "Japan", "Taiwan", "Australia", "China", "Other markets"] as const;

const japaneseMetalNames: Record<string, string> = {
  Silver: "銀", Aluminium: "アルミニウム", Copper: "銅", Silicon: "シリコン",
};

const japanesePriceSources: Record<string, string> = {
  "Kitco silver bid, 10 Nov 2026; supplied Japan cost analysis": "Kitco の銀買値（2026年11月10日、日本向けコスト分析資料）",
  "LME 3M aluminium, 10 Nov 2026; supplied Japan cost analysis": "LME アルミニウム3カ月物（2026年11月10日、日本向けコスト分析資料）",
  "LME 3M copper, 10 Nov 2026; supplied Japan cost analysis": "LME 銅3カ月物（2026年11月10日、日本向けコスト分析資料）",
  "Recovered-silicon reference; supplied Japan cost analysis": "回収シリコンの参考価格（日本向けコスト分析資料）",
  "XAG/USD spot via currency-api": "銀の米ドル建て現物価格（currency-api）",
  "LME aluminium cash via Westmetall": "LME アルミニウム現物価格（Westmetall）",
  "LME copper 3-month via Westmetall": "LME 銅3カ月物（Westmetall）",
  "SMM silicon metal East China #553": "SMM 華東地区の金属シリコン #553",
};

const chineseMetalNames: Record<string, string> = {
  Silver: "銀", Aluminium: "鋁", Copper: "銅", Silicon: "矽",
};

const chinesePriceSources: Record<string, string> = {
  "Kitco silver bid, 10 Nov 2026; supplied Japan cost analysis": "Kitco 白銀買價（2026 年 11 月 10 日，日本成本分析資料）",
  "LME 3M aluminium, 10 Nov 2026; supplied Japan cost analysis": "LME 三個月期鋁價（2026 年 11 月 10 日，日本成本分析資料）",
  "LME 3M copper, 10 Nov 2026; supplied Japan cost analysis": "LME 三個月期銅價（2026 年 11 月 10 日，日本成本分析資料）",
  "Recovered-silicon reference; supplied Japan cost analysis": "回收矽參考價格（日本成本分析資料）",
  "XAG/USD spot via currency-api": "美元計價白銀現貨價（currency-api）",
  "LME aluminium cash via Westmetall": "LME 鋁現貨價（Westmetall）",
  "LME copper 3-month via Westmetall": "LME 三個月期銅價（Westmetall）",
  "SMM silicon metal East China #553": "SMM 華東 #553 金屬矽價格",
};

export async function loadSolutionOperatingData(market: PublicSolutionMarket) {
  const snapshot = isAdditionalParameterMarket(market)
    ? await activeOurSolutionParameterData(market).catch(() => null)
    : await activeOurSolutionDataOrSeed(market);
  if (!snapshot) return null;
  const { data } = snapshot;
  return { data, prices: await effectiveMetalPrices(data) };
}

export async function loadSolutionView(market: PublicSolutionMarket, locale: OurSolutionLocale = "en-US") {
  const citation = locale === "zh-TW"
    ? { metals: chineseMetalNames, sources: chinesePriceSources, master: "解決方案主參數表" }
    : locale === "ja-JP"
      ? { metals: japaneseMetalNames, sources: japanesePriceSources, master: "ソリューションのマスター設定" }
      : null;
  const [operatingData, globalPressureBaseline, pricing] = await Promise.all([
    loadSolutionOperatingData(market),
    market !== "US" ? activeOurSolutionDataOrSeed("US") : null,
    market === "US" ? activePricing(market).catch(() => null) : null,
  ]);
  if (!operatingData) return null;
  const { data, prices } = operatingData;
  const result = model(data, prices);
  // The same global comparison must be visible under every operating market.
  const perCapitaKg = globalPressureBaseline ? model(globalPressureBaseline.data).perCapitaKg : result.perCapitaKg;
  const installed = capacityHistory(data);
  const tonnesPerMw = result.kgPerMw / 1000;
  const retirementMarketWaves = Object.fromEntries(retirementMarkets.map(country => [
    country,
    computeRetirementWave(new Map(Object.entries(installed[country]).map(([year, gw]) => [Number(year), gw * 1000])), tonnesPerMw, result.shapes),
  ])) as Record<typeof retirementMarkets[number], ReturnType<typeof computeRetirementWave>>;
  const economicsData = economicsView(data, prices);
  const { region, currency, panelsPerMonth, processingFeeUnit } = economicsData.scenario;
  const panelWeightKg = scenarioPanelWeightKg(data);
  const panelWeightLb = scenarioPanelWeightLb(data);
  const weightUnit = processingFeeUnit.endsWith("/kg") ? "kg" as const : "lb" as const;

  return {
    market,
    economicsData,
    capacityTrend: capacityTrend(data),
    retirementWave: retirementMarketWaves[solutionDemandMarket(market)],
    retirementMarketWaves,
    waveAssumptions: {
      defaultLifetime: result.defaultLifetime as 25 | 18 | 15 | 12,
      loss: result.loss,
      shapes: result.shapes,
      panelWeightKg,
      panelWeightLb,
      weightUnit,
      panelRating: Number(data.assumptions[10]["Panel rating"][0]),
      tonnesPerMw,
    },
    pressureData: Object.keys(perCapitaKg.World).map(year => ({
      year,
      values: ["World", "Europe", "United States", "Japan", "Taiwan", "China", "Australia"].map(country => perCapitaKg[country][Number(year)]),
    })),
    routeMetrics: impactRouteMetrics(data, result),
    breakeven: {
      region, currency, panelsPerMonth, feeUnit: processingFeeUnit, panelWeightKg, panelWeightLb, weightUnit,
      source: citation?.master ?? "Our Solution parameter master",
      fees: Object.values(result.solutions).map(solution => ({ code: solution.code, breakevenFee: solution.breakevenFee })),
    },
    pricingRules: pricing?.rules ?? (market === "JP" ? initialJapanRules : initialRules),
    residentialSurchargePct: pricing?.transport?.residentialSurchargePct,
    showPublicPricingBenchmark: market === "US",
    priceSources: Object.entries(prices).map(([metal, value]) => {
      if (!citation) return `${metal}: ${value.source}${value.workbookValue ? "" : `, ${value.asOf}`}`;
      const date = value.workbookValue ? "" : `（${new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(value.asOf))}）`;
      return `${citation.metals[metal] ?? metal}：${citation.sources[value.source] ?? value.source}${date}`;
    }).join(citation ? "／" : " · "),
  };
}
