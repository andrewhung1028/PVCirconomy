import type { Metadata } from "next";
import { UnifiedPageRoute } from "../../components/unified-page-route";
import { upcyclingPage } from "../../components/unified-page-data";

export const metadata: Metadata = {
  title: "材料再利用 | PV Circonomy",
  description: "將太陽能板的材料分離回收，保留乾淨的材料及相關資料，供後續產業再利用。",
  alternates: { canonical: "/zh/material-upcycling/", languages: {
    "en-US": "/material-upcycling/", "ja-JP": "/ja/material-upcycling/", "zh-TW": "/zh/material-upcycling/",
  } },
};

export default function Page() {
  return <UnifiedPageRoute {...upcyclingPage} locale="zh-TW" pageLabel="材料再利用" hero={{...upcyclingPage.hero,
    title: "回收材料，\n走向下一個用途。",
    description: "將太陽能板的材料分離回收，保留乾淨的材料及相關資料，供後續產業再利用。",
  }} footerNote="材料再利用 · PV Circonomy" />;
}
