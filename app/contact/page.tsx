import { UnifiedPageRoute } from '../components/unified-page-route';
import { contactPage } from '../components/unified-page-data';

export const metadata = { title: 'Contact | PV Circonomy', description: 'Choose a solar panel recycling, PV Circulator or recovered-material inquiry path.' };
export default function ContactPage(){return <UnifiedPageRoute {...contactPage}/>}
