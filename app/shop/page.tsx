import { Suspense } from 'react';
import { Intro, Shell, ShopForm } from '../components/marketing';
export const metadata = { title: 'Book & inquire | PV Circonomy' };
export default function Shop(){return <Shell><Intro label="SHOP / BOOK & INQUIRE" title="Make your next move." description="Recycle your panels. Build your capacity. Source circular products. Start with what you need."/><Suspense fallback={<p className="pc-wrap">Loading your options…</p>}><ShopForm/></Suspense></Shell>}
