import { UnifiedPageRoute } from '../components/unified-page-route';
import { companyPage } from './company-page-data';

export const metadata = {
  title: 'Company | PV Circonomy',
  description: 'PV Circonomy, its parent company TSGC and the role of PV Circulator in solar panel recycling services and equipment sales.',
};
export default function CompanyPage(){return <UnifiedPageRoute {...companyPage}/>}
