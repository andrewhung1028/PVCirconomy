import { Shell, Action } from '../components/marketing';

export const metadata = { title: 'Recycling services | PV Circonomy' };

export default function Services() {
  return <Shell><section className="pc-intro pc-wrap"><p className="pc-eyebrow">SERVICES · CALIFORNIA</p><h1>Have panels to recycle?</h1><p className="pc-lead">Describe your panels, location and timing. Explore a sample estimate and prepare your recycling request.</p><div className="pc-actions pc-intro-actions"><Action href="/services/solar-panel-recycling">Estimate my recycling job</Action></div></section></Shell>;
}
