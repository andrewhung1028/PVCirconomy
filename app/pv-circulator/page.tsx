import { loadPVCirculatorReference } from "../components/pv-circulator-route-data";
import localFont from 'next/font/local';
import {PVCirculatorPage} from '../components/pv-circulator-page';
export const dynamic = "force-dynamic";
const manrope=localFont({src:'../../public/fonts/Manrope-Variable.ttf',weight:'300 800',display:'swap'});
export const metadata={title:'PV Circulator | Industrial Solar Panel Recycling',description:'Automated layer-by-layer PV recycling designed to preserve material quality and value.'};
export default async function Page({ searchParams }: { searchParams: Promise<{ market?: string }> }) {
  const props = await loadPVCirculatorReference((await searchParams).market, "en-US");
  return <div className={manrope.className} lang="en-US"><PVCirculatorPage locale="en-US" {...props} /></div>;
}
