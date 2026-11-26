export const ourSolutionMarkets = ["US", "JP"] as const;
export type OurSolutionMarket = typeof ourSolutionMarkets[number];
export const ourSolutionParameterMarkets = {
  US: { label: "美國", currency: "USD", locale: "en-US", regionCode: "US", region: "United States" },
  JP: { label: "日本", currency: "JPY", locale: "ja-JP", regionCode: "JP", region: "Japan" },
  AU: { label: "澳洲", currency: "AUD", locale: "en-AU", regionCode: "AU", region: "Australia" },
  CA: { label: "加拿大", currency: "CAD", locale: "en-CA", regionCode: "CA", region: "Canada" },
  UK: { label: "英國", currency: "GBP", locale: "en-GB", regionCode: "GB", region: "United Kingdom" },
  EU: { label: "歐洲", currency: "EUR", locale: "en", regionCode: "EU", region: "Europe" },
} as const;
export type OurSolutionParameterMarket = keyof typeof ourSolutionParameterMarkets;
export type AdditionalParameterMarket = Exclude<OurSolutionParameterMarket, OurSolutionMarket>;
export type OurSolutionParameterProfile = typeof ourSolutionParameterMarkets[OurSolutionParameterMarket];

export function isAdditionalParameterMarket(market: OurSolutionParameterMarket): market is AdditionalParameterMarket {
  return market !== "US" && market !== "JP";
}

export function parameterProfileForRegion(regionCode: string): OurSolutionParameterProfile | undefined {
  const region = regionCode.trim().toUpperCase();
  return /^US(?:-|$)/.test(region) ? ourSolutionParameterMarkets.US
    : Object.values(ourSolutionParameterMarkets).find(profile => profile.regionCode === region);
}
export const publicSolutionMarkets = [...ourSolutionMarkets, "AU", "CA", "UK", "EU"] as const;
export type PublicSolutionMarket = typeof publicSolutionMarkets[number];
export const ourSolutionLocales = ["en-US", "ja-JP", "zh-TW"] as const;
export type OurSolutionLocale = typeof ourSolutionLocales[number];

export const marketNames = {
  "en-US": { US: "United States", JP: "Japan", AU: "Australia", CA: "Canada", UK: "United Kingdom", EU: "Europe" },
  "ja-JP": { US: "米国", JP: "日本", AU: "オーストラリア", CA: "カナダ", UK: "英国", EU: "欧州" },
  "zh-TW": { US: "美國", JP: "日本", AU: "澳洲", CA: "加拿大", UK: "英國", EU: "歐洲" },
} satisfies Record<OurSolutionLocale, Record<PublicSolutionMarket, string>>;

export function publicSolutionMarketForPage(value: unknown, locale: OurSolutionLocale): PublicSolutionMarket {
  return publicSolutionMarkets.find(market => market === value) ?? solutionMarketForPage(value, locale);
}

export function solutionMarketForPage(value: unknown, locale: OurSolutionLocale): OurSolutionMarket {
  return ourSolutionMarkets.find(market => market === value) ?? (locale === "ja-JP" ? "JP" : "US");
}

export function solutionHref(locale: OurSolutionLocale, market: PublicSolutionMarket) {
  return `${localizedPublicPath(locale, "/solutions/")}?market=${market}`;
}

const globalDemandMarket = {
  US: "United States",
  JP: "Japan",
  AU: "Australia",
  EU: "Europe",
  CA: "World",
  UK: "World",
} as const;

export function solutionDemandMarket(market: PublicSolutionMarket) {
  return globalDemandMarket[market];
}

export function businessCaseHref(locale: OurSolutionLocale, market: PublicSolutionMarket) {
  return `${localizedPublicPath(locale, "/business-case/")}?market=${market}`;
}

export function localizedPublicPath(locale: OurSolutionLocale, path: `/${string}`) {
  return `${locale === "ja-JP" ? "/ja" : locale === "zh-TW" ? "/zh" : ""}${path}`;
}

export function ourSolutionMarket(value: unknown): OurSolutionParameterMarket | null {
  if (value == null) return "US";
  return typeof value === "string" && Object.hasOwn(ourSolutionParameterMarkets, value)
    ? value as OurSolutionParameterMarket : null;
}

export function assertOurSolutionMarketRegion(market: OurSolutionParameterMarket, regionCode: unknown): asserts regionCode is string {
  const normalized = typeof regionCode === "string" ? regionCode.trim().toUpperCase() : "";
  if (market === "JP" && normalized !== "JP") {
    throw Error(`目標市場 JP 與 Scenario.region_code "${String(regionCode)}" 不符；market=JP 必須使用 "JP"。`);
  }
  if (market === "US" && normalized === "JP") {
    throw Error('目標市場 US 不接受 Scenario.region_code "JP"；請切換至「日本參數」後再上傳。');
  }
  if (market === "US" && !/^US(?:-|$)/.test(normalized)) {
    throw Error('目標市場 US 必須使用美國 Scenario.region_code。');
  }
  if (isAdditionalParameterMarket(market) && normalized !== ourSolutionParameterMarkets[market].regionCode) {
    throw Error(`目標市場 ${market} 必須使用 Scenario.region_code "${ourSolutionParameterMarkets[market].regionCode}"。`);
  }
}
