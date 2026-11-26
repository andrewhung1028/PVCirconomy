import type { Metadata } from "next";
import { UnifiedPageRoute } from "../../components/unified-page-route";
import { easyCyclePage } from "../../components/unified-page-data";

export const metadata: Metadata = {
  title: "EasyCycle | PV Circonomy",
  description: "從收件、處理、材料回收，到最後的材料去向，都記錄在同一本回收護照。",
  alternates: { canonical: "/zh/easycycle/", languages: {
    "en-US": "/easycycle/", "ja-JP": "/ja/easycycle/", "zh-TW": "/zh/easycycle/",
  } },
};

export default function Page() {
  return <UnifiedPageRoute {...easyCyclePage} locale="zh-TW" pageLabel="EasyCycle" hero={{...easyCyclePage.hero,
    title: "每一片面板，\n都有可追溯的紀錄。",
    description: "從收件、處理、材料回收，到最後的材料去向，都記錄在同一本回收護照。",
  }} footerNote="EasyCycle · PV Circonomy" />;
}
