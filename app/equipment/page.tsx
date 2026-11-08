import Link from 'next/link';
import { Shell } from '../components/marketing';
import '../components/journey.css';

export const metadata = { title: 'Recycling equipment | PV Circonomy', description: 'Explore PV Circulator and JB Tool, then prepare an equipment request.' };

export default function EquipmentIndex() {
  return <Shell><article className="pc-journey"><header className="pc-journey-hero pc-wrap"><p className="pc-eyebrow">TSGC · EQUIPMENT SALES</p><h1>Building your recycling operation?</h1><p className="pc-lead">Explore PV Circulator and JB Tool, test your assumptions, and prepare an equipment request.</p></header><div className="pc-wrap pc-hook-grid">
    <article className="pc-hook"><h2>PV Circulator</h2><p>Automated physical dismantling and material separation. Configure a request and, if you want, model a sample business case.</p><Link className="pc-button" href="/equipment/pv-circulator">Configure my equipment request</Link></article>
    <article className="pc-hook"><h2>JB Tool</h2><p>A separate product request. Specifications are not listed here. You describe the processing requirements.</p><Link className="pc-button" href="/equipment/jbtool">Request JB Tool</Link></article>
  </div></article></Shell>;
}
