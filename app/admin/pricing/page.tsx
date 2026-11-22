import localFont from 'next/font/local';
import {PricingAdmin} from '../../components/pricing-admin';
const font=localFont({src:'../../../public/fonts/Manrope-Variable.ttf',weight:'300 800',display:'swap'});
export const metadata={title:'價格管理 | PV Circonomy',robots:{index:false,follow:false}};
export default function Page(){return <div className={font.className}><PricingAdmin/></div>}
