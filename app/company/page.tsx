import localFont from 'next/font/local';
import { CompanyPage } from './company-page';

const manrope = localFont({ src: '../../public/fonts/Manrope-Variable.ttf', weight: '300 800', display: 'swap' });

export const metadata = {
  title: 'Company | PV Circonomy',
  description: 'The PV Circonomy mission: clear processing estimates, transparent delivery terms and visibility into the recycling journey.',
};
export default function CompanyRoute(){return <div className={manrope.className}><CompanyPage/></div>}
