import { ourSolutionLocales, publicSolutionMarkets, type OurSolutionLocale, type PublicSolutionMarket } from "./market";

export const publicPreferenceCookie = "pv_public_preference";

const euCountries = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

export function publicMarketFromCountry(country: string | null): PublicSolutionMarket {
  const code = country?.toUpperCase() ?? "";
  if (code === "GB" || code === "UK") return "UK";
  if (code === "JP" || code === "AU" || code === "CA") return code;
  return euCountries.has(code) ? "EU" : "US";
}

export function parsePublicPreference(value: string | undefined) {
  const [locale, market] = value?.split(".") ?? [];
  const language = ourSolutionLocales.find(option => option === locale);
  const region = publicSolutionMarkets.find(option => option === market);
  return language && region ? { locale: language, market: region } : null;
}

export function rememberPublicPreference(locale: OurSolutionLocale, market: PublicSolutionMarket) {
  document.cookie = `${publicPreferenceCookie}=${locale}.${market}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}
