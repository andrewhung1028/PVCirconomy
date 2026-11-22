import localFont from 'next/font/local';
import { ReviewHome } from './components/review-home';
const manrope = localFont({ src: '../public/fonts/Manrope-Variable.ttf', weight: '300 800', display: 'swap' });
export const metadata = { title: 'Solar panel recycling & online quotations | PV Circonomy', description: 'Solar panel recycling with online quotations: processing estimates, delivery, recycling traceability and frequently asked questions.' };
export default function Home() { return <div className={manrope.className}><ReviewHome/></div>; }
