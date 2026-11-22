import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { OurSolution } from "../components/our-solution";
import { activeOurSolutionDataOrSeed } from "../../server/our-solution/store";

import { loadMasterData } from "../../lib/business-case/master-data";
import { routeEnvironmentalMetrics } from "../../lib/route-comparison";
import { breakevenFees } from "../../lib/business-case/breakeven";
import type { BreakevenView } from "../components/our-solution";

const manrope = Manrope({ subsets: ["latin"], weight: ["300", "800"] });

export const metadata: Metadata = {
  title: "Our Solution | PV Circonomy",
  description:
    "A connected solar circularity solution for panel owners, recyclers and recovered-material partners.",
};

export const dynamic = "force-dynamic";

export default async function SolutionsPage() {
  const economics = await activeOurSolutionDataOrSeed();
  const master = await loadMasterData();
  const routeMetrics = routeEnvironmentalMetrics(master);
  let breakeven: BreakevenView = null;
  try {
    const result = breakevenFees(master, { regionCode: economics.data.scenario.regionCode, panelsPerMonth: economics.data.scenario.panelsPerMonth }, ["CONVENTIONAL", "HOT_KNIFE", "PVCIRCULATOR"].filter(code => master.solutions.some(s => s.code === code && s.active)));
    breakeven = { region: result.region, feeUnit: result.feeUnit, currency: result.currency, panelsPerMonth: result.panelsPerMonth, panelWeightLb: result.panelWeightLb, source: master.source, fees: result.fees.map(({ code, breakevenFee }) => ({ code, breakevenFee })) };
  } catch (error) { console.warn("Breakeven fees unavailable:", (error as Error).message); }
  return <div className={manrope.className}><OurSolution economicsData={{ ...economics.data, solutions: economics.data.solutions.map(({ residualMetricTons, ...solution }) => solution), meta: { ...economics.data.meta, sourceSite: "/business-case/", calculatorDataApi: "/api/calculator-data/", calculationApi: "/api/calculate/" } }} routeMetrics={routeMetrics} breakeven={breakeven} /></div>;
}
