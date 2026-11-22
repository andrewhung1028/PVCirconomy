import './globals.css';
import { PublicSectionScroll } from './components/public-section-scroll';

export const metadata={title:'PV Circonomy | A new life for solar',description:'Solar panel recycling, PV Circulator technology and circular products.'};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><PublicSectionScroll />{children}</body></html>;
}
