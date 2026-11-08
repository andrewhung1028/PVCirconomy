import './globals.css';
import { ReviewProvider } from './components/review-provider';

export const metadata = { title: 'PV Circonomy | Solar panel recycling and equipment', description: 'PV Circonomy provides recycling services in California. TSGC develops PV Circulator equipment for recycling operators.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><ReviewProvider>{children}</ReviewProvider></body></html>;
}
