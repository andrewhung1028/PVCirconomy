import type { Metadata } from "next";
import { upcyclingPageJa } from "../../components/unified-page-data";
import { UnifiedPageRoute } from "../../components/unified-page-route";

export const metadata: Metadata = {
  title: "材料のアップサイクル | PV Circonomy",
  description: upcyclingPageJa.hero.description,
  alternates: { canonical: "/ja/material-upcycling/", languages: { "en-US": "/material-upcycling/", "ja-JP": "/ja/material-upcycling/" } },
};

export default function Page() {
  return <UnifiedPageRoute {...upcyclingPageJa} />;
}
