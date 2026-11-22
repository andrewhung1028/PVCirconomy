import localFont from 'next/font/local';
import {PVCirculatorPage} from '../components/pv-circulator-page';
const manrope=localFont({src:'../../public/fonts/Manrope-Variable.ttf',weight:'300 800',display:'swap'});
export const metadata={title:'PV Circulator | Industrial Solar Panel Recycling',description:'Automated layer-by-layer PV recycling designed to preserve material quality and value.'};
export default function Page(){return <div className={manrope.className}><PVCirculatorPage/></div>}
