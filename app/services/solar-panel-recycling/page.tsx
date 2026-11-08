import { Shell } from '../../components/marketing';
import { ServiceFlow } from '../../components/service-flow';
import '../../components/journey.css';

export const metadata = { title: 'Estimate a recycling job | PV Circonomy', description: 'Describe panels, a California location, and timing. Review a sample handling estimate and prepare a test recycling request.' };

export default function SolarRecyclingPage() {
  return <Shell><article className="pc-journey"><header className="pc-journey-hero pc-wrap"><p className="pc-eyebrow">PV CIRCONOMY · CALIFORNIA SERVICE</p><h1>Have panels to recycle?</h1><p className="pc-lead">Describe your panels, location and timing. Explore a sample estimate and prepare your recycling request.</p></header><div className="pc-wrap"><ServiceFlow /></div></article></Shell>;
}
