import { UnifiedPageRoute } from '../components/unified-page-route';
import { easyCyclePage } from '../components/unified-page-data';

export const metadata = {
  title: 'EasyCycle | PV Circonomy',
  description: 'Recycling records, material traceability and environmental reporting for your solar panel batch.',
};

export default function EasyCyclePage(){return <UnifiedPageRoute {...easyCyclePage}/>}
