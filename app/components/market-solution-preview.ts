import { marketNames, type OurSolutionLocale, type PublicSolutionMarket } from "../../lib/our-solution/market";
import type { UnifiedPublicPageProps } from "./unified-public-page";

export function unavailableSolutionMarket(market: PublicSolutionMarket, locale: OurSolutionLocale): UnifiedPublicPageProps {
  const name = marketNames[locale][market];
  const description = {
    "en-US": "The operating figures for this market are currently unavailable.",
    "zh-TW": "目前無法顯示此市場的營運數據。",
    "ja-JP": "この市場の運営試算データは現在ご利用いただけません。",
  }[locale];
  return {
    locale,
    solutionMarket: market,
    pageLabel: name,
    hero: { title: name, description, poster: "/images/pvcirculator-oursolution-poster.jpg" },
    sections: [],
    footerNote: "PV Circulator · Material Upcycling · EasyCycle",
  };
}
