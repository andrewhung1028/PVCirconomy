import { redirect } from "next/navigation";
import { publicSolutionMarketForPage, solutionHref } from "../../lib/our-solution/market";

export default async function ChineseIndexPage({ searchParams }: {
  searchParams: Promise<{ market?: string | string[] }>;
}) {
  redirect(solutionHref("zh-TW", publicSolutionMarketForPage((await searchParams).market, "zh-TW")));
}
