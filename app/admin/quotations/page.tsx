import localFont from 'next/font/local';
import {QuotationsAdmin} from '../../components/quotations-admin';
const font=localFont({src:'../../../public/fonts/Manrope-Variable.ttf',weight:'300 800',display:'swap'});
export const metadata={title:'報價管理 | PV Circonomy',robots:{index:false,follow:false}};
export default function Page(){return <div className={font.className}><QuotationsAdmin/></div>}
