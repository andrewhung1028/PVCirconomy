import { loadPVCirculatorReference } from "../../components/pv-circulator-route-data";
import type {Metadata} from 'next';
import {PVCirculatorPage} from '../../components/pv-circulator-page';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'PV Circulator | PV Circonomy',alternates:{canonical:'/ja/pv-circulator/',languages:{'en-US':'/pv-circulator/','ja-JP':'/ja/pv-circulator/'}}};

export default async function Page({ searchParams }: { searchParams: Promise<{ market?: string }> }) {
  const props = await loadPVCirculatorReference((await searchParams).market, "ja-JP");
  return <div lang="ja-JP"><PVCirculatorPage locale="ja-JP" {...props} /></div>;
}
