import { UnifiedPageRoute } from '../components/unified-page-route';
import { aboutPage } from '../components/unified-page-data';

export const metadata = { title: 'About us | PV Circonomy', description: 'About PV Circonomy solar panel recycling services and PV Circulator technology.' };
export default function AboutUsPage(){return <UnifiedPageRoute {...aboutPage}/>}
