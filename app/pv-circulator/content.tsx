import localFont from "next/font/local";
import { PVCirculatorPage } from "../components/pv-circulator-page";
import { loadMasterData } from "../../lib/business-case/master-data";
import { publicRoutes, routeComparison } from "../../lib/route-comparison";

const manrope = localFont({ src: "../../public/fonts/Manrope-Variable.ttf", weight: "300 800", display: "swap" });

export async function CirculatorContent({ zh = false }: { zh?: boolean }) {
  const routes = publicRoutes(routeComparison(await loadMasterData()));
  return <div className={manrope.className}><PVCirculatorPage routes={routes} zh={zh} /></div>;
}
