import { loadPVCirculatorReference } from "../../components/pv-circulator-route-data";
import type { Metadata } from "next";
import copy from "../../../lib/i18n/pv-circulator-zh.json";
import { PVCirculatorPage } from "../../components/pv-circulator-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: copy["PV Circulator | Industrial Solar Panel Recycling"],
  description: copy["Automated layer-by-layer PV recycling designed to preserve material quality and value."],
  alternates: { canonical: "/zh/pv-circulator/", languages: {
    "en-US": "/pv-circulator/", "ja-JP": "/ja/pv-circulator/", "zh-TW": "/zh/pv-circulator/",
  } },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ market?: string }> }) {
  const props = await loadPVCirculatorReference((await searchParams).market, "zh-TW");
  return <div className="pv-traditional-chinese" lang="zh-TW"><PVCirculatorPage locale="zh-TW" {...props} /></div>;
}
