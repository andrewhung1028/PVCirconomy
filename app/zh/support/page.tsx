import { SupportPage } from "../../components/support-page";
import { publicSolutionMarketForPage } from "../../../lib/our-solution/market";

export const metadata = { title: "PV Circonomy Support" };

export default async function Page({ searchParams }: { searchParams: Promise<{ market?: string }> }) {
  const locale = "zh-TW";
  const market = publicSolutionMarketForPage((await searchParams).market, locale);
  return <SupportPage locale={locale} market={market} />;
}
