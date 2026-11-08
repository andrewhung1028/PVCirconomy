import { Shell } from '../../components/marketing';
import { OrderComplete } from '../../components/order-desk';
import '../../components/journey.css';

export const metadata = { title: 'Test order created | PV Circonomy' };

export default function CompletePage() {
  return <Shell><article className="pc-journey"><header className="pc-journey-hero pc-wrap"><p className="pc-eyebrow">TEST ORDER</p><h1>Test order created</h1></header><div className="pc-wrap"><OrderComplete /></div></article></Shell>;
}
