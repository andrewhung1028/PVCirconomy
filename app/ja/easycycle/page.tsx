import type { Metadata } from "next";
import { easyCyclePageJa } from "../../components/unified-page-data";
import { UnifiedPageRoute } from "../../components/unified-page-route";

export const metadata: Metadata = {
  title: "EasyCycle | リサイクルパスポート",
  description: easyCyclePageJa.hero.description,
  alternates: { canonical: "/ja/easycycle/", languages: { "en-US": "/easycycle/", "ja-JP": "/ja/easycycle/" } },
};

export default function Page() {
  return <UnifiedPageRoute {...easyCyclePageJa} />;
}
