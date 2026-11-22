import localFont from 'next/font/local';
import {PVCirculatorPage} from '../components/pv-circulator-page';
import {loadMasterData} from "../../lib/business-case/master-data";
import {routeComparison, publicRoutes} from "../../lib/route-comparison";
export const dynamic = "force-dynamic";
const manrope=localFont({src:'../../public/fonts/Manrope-Variable.ttf',weight:'300 800',display:'swap'});
export const metadata={title:'PV Circulator | Industrial Solar Panel Recycling',description:'Automated layer-by-layer PV recycling designed to preserve material quality and value.'};
export default async function Page(){const routes=publicRoutes(routeComparison(await loadMasterData()));return <div className={manrope.className}><PVCirculatorPage routes={routes}/></div>}
