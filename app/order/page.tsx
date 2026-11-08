import { Shell } from '../components/marketing';
import { OrderDesk } from '../components/order-desk';
import '../components/journey.css';

export const metadata = { title: 'Test order summary | PV Circonomy' };

export default function OrderPage() {
  return <Shell><article className="pc-journey"><header className="pc-journey-hero pc-wrap"><p className="pc-eyebrow">TEST ORDER</p><h1>Review the request</h1><p className="pc-lead">Known sample charges stay separate from items that are quoted after review. Nothing is paid or sent from this page until you create a test order, and even then it stays in this browser.</p></header><div className="pc-wrap"><OrderDesk /></div></article></Shell>;
}
