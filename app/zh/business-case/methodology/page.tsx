import type { Metadata } from "next";
import { BusinessCaseMethodology } from "../../../business-case/methodology-content";
import "../../../business-case/calculator.css";

export const metadata: Metadata = {
  title: "營運試算方法 | PV Circonomy",
  description: "太陽能板處理產能、材料收入、營運成本、EBITDA 與投資回收期的計算方式。",
  alternates: { languages: {
    "en-US": "/business-case/methodology/", "ja-JP": "/ja/business-case/methodology/", "zh-TW": "/zh/business-case/methodology/",
  } },
};

export default async function ChineseMethodologyPage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  return <div className="pv-traditional-chinese" lang="zh-TW"><BusinessCaseMethodology locale="zh-TW" region={(await searchParams).region} /></div>;
}
