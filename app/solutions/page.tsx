import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { OurSolution } from "../components/our-solution";
import { activeOurSolutionDataOrSeed } from "../../server/our-solution/store";

const manrope = Manrope({ subsets: ["latin"], weight: ["300", "800"] });

export const metadata: Metadata = {
  title: "Our Solution | PV Circonomy",
  description:
    "A connected solar circularity solution for panel owners, recyclers and recovered-material partners.",
};

export const dynamic = "force-dynamic";

export default async function SolutionsPage() {
  const economics = await activeOurSolutionDataOrSeed();
  return <div className={manrope.className}><OurSolution economicsData={economics.data} /></div>;
}
