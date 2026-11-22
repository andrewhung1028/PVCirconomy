import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { OurSolution } from "../components/our-solution";
import { activeOurSolutionDataOrSeed } from "../../server/our-solution/store";

import { loadMasterData } from "../../lib/business-case/master-data";
import { routeEnvironmentalMetrics } from "../../lib/route-comparison";

const manrope = Manrope({ subsets: ["latin"], weight: ["300", "800"] });

export const metadata: Metadata = {
  title: "Our Solution | PV Circonomy",
  description:
    "A connected solar circularity solution for panel owners, recyclers and recovered-material partners.",
};

export const dynamic = "force-dynamic";

export default async function SolutionsPage() {
  const economics = await activeOurSolutionDataOrSeed();
  const routeMetrics = routeEnvironmentalMetrics(await loadMasterData());
  return <div className={manrope.className}><OurSolution economicsData={{ ...economics.data, solutions: economics.data.solutions.map(({ residualMetricTons, ...solution }) => solution), meta: { ...economics.data.meta, sourceSite: "/business-case/", calculatorDataApi: "/api/calculator-data/", calculationApi: "/api/calculate/" } }} routeMetrics={routeMetrics} /></div>;
}
