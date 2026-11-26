import type { PublicSolutionMarket } from "../our-solution/market";
import { isSupportedCountry } from "./supported-countries";
import type { Region } from "./types";

const preferredRegion: Partial<Record<PublicSolutionMarket, string>> = {
  US: "US-CA",
  AU: "AU-NSW",
};

export function businessCaseMarketForCountry(countryCode: string): PublicSolutionMarket | undefined {
  if (countryCode === "US" || countryCode === "JP" || countryCode === "AU" || countryCode === "CA") {
    return countryCode;
  }
  if (countryCode === "GB") return "UK";
  return isSupportedCountry(countryCode) ? "EU" : undefined;
}

export function initialBusinessCaseRegion(regions: Region[], market?: PublicSolutionMarket, regionCode?: string) {
  const available = regions.filter(region =>
    region.active !== false && (!market || businessCaseMarketForCountry(region.countryCode) === market),
  );
  return available.find(region => region.code === regionCode)
    ?? available.find(region => region.code === preferredRegion[market ?? "US"])
    ?? available[0];
}
