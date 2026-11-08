import Link from 'next/link';
import { Shell } from './components/marketing';
import './components/journey.css';

export const metadata = {
  title: 'Recycle your solar panels | PV Circonomy',
  description: 'PV Circonomy provides recycling services in California. TSGC develops PV Circulator equipment for automated physical dismantling and material separation.',
};

export default function Home() {
  return <Shell>
    <section className="pc-hero pc-choice-hero">
      <video autoPlay muted loop playsInline poster="/PVCirconomy/images/circulator-poster.jpg" aria-label="PV Circulator separating a retired solar panel">
        <source src="/PVCirconomy/videos/pv-circulator-operation.mp4" type="video/mp4" />
      </video>
      <div className="pc-hero-shade" />
      <div className="pc-wrap pc-hero-content">
        <p className="pc-eyebrow">PV CIRCONOMY · TSGC TECHNOLOGIES</p>
        <h1>Recycle your solar panels. Or build the capability to recycle them.</h1>
        <p className="pc-lead">PV Circonomy provides recycling services in California. TSGC develops PV Circulator equipment for automated physical dismantling and material separation.</p>
        <div className="pc-choice-grid">
          <Link className="pc-choice-card" href="/services/solar-panel-recycling"><em>Services</em><strong>Have panels to recycle?</strong><span>Estimate my recycling job</span></Link>
          <Link className="pc-choice-card" href="/equipment"><em>Equipment</em><strong>Building your recycling operation?</strong><span>Explore PV Circulator and JB Tool</span></Link>
        </div>
      </div>
    </section>
    <section className="pc-section pc-wrap"><div className="pc-hook-grid">
      <article className="pc-hook"><p className="pc-eyebrow">PV CIRCONOMY · CALIFORNIA</p><h2>Have panels to recycle?</h2><p>Describe your panels, location and timing. Explore a sample estimate and prepare your recycling request.</p><Link className="pc-button" href="/services/solar-panel-recycling">Estimate my recycling job</Link></article>
      <article className="pc-hook"><p className="pc-eyebrow">TSGC · EQUIPMENT SALES</p><h2>Building your recycling operation?</h2><p>Explore PV Circulator and JB Tool, test your assumptions, and prepare an equipment request.</p><div className="pc-inline-links"><Link className="pc-button" href="/equipment/pv-circulator">Explore PV Circulator</Link><Link className="pc-button pc-button-secondary" href="/equipment/jbtool">JB Tool</Link></div></article>
    </div></section>
  </Shell>;
}
