import { UnifiedPageRoute } from '../components/unified-page-route';
import { missionPage } from '../components/unified-page-data';

export const metadata = { title: 'Mission | PV Circonomy', description: 'PV Circonomy mission for clearer, more circular solar panel recycling.' };
export default function MissionPage(){return <UnifiedPageRoute {...missionPage}/>}
