import { Suspense } from 'react';
import { PreserveContextLink } from './components/context-links';
import './components/journey.css';
import { Shell } from './components/marketing';

export const metadata = {
  title: 'Have panels to recycle? | PV Circonomy',
  description: 'Choose a recycling plan for retired solar panels, or evaluate PV Circulator equipment. This is a website preview, not a live order system.',
};

export default function Home() {
  return (
    <Shell>
      <section className="pc-hero pc-choice-hero" id="choose">
        <video autoPlay muted loop playsInline poster="/PVCirconomy/images/circulator-poster.jpg" aria-label="PV Circulator separating a retired solar panel">
          <source src="/PVCirconomy/videos/pv-circulator-operation.mp4" type="video/mp4" />
        </video>
        <div className="pc-hero-shade" />
        <div className="pc-wrap pc-hero-content">
          <p className="pc-eyebrow">PV CIRCONOMY</p>
          <h1>Have panels to recycle—or a recycling business to build?</h1>
          <p className="pc-lead">Choose the task that matches why you are here.</p>
          <Suspense fallback={<div className="pc-choice-grid"><a className="pc-choice-card" href="/PVCirconomy/services/solar-panel-recycling/"><strong>Recycle my panels</strong></a><a className="pc-choice-card" href="/PVCirconomy/equipment/pv-circulator/"><strong>Evaluate equipment</strong></a></div>}>
            <div className="pc-choice-grid">
              <PreserveContextLink className="pc-choice-card" href="/services/solar-panel-recycling" intent="service">
                <em>Panels to recycle</em>
                <strong>Recycle my panels</strong>
                <span>Service options. No order is placed.</span>
              </PreserveContextLink>
              <PreserveContextLink className="pc-choice-card" href="/equipment/pv-circulator" intent="equipment">
                <em>A recycling business</em>
                <strong>Evaluate equipment</strong>
                <span>PV Circulator and the business-case assumptions.</span>
              </PreserveContextLink>
            </div>
          </Suspense>
        </div>
      </section>

      <section className="pc-section pc-wrap">
        <div className="pc-hook-grid">
          <article className="pc-hook" id="service-path">
            <p className="pc-eyebrow">SOLAR ASSET OWNERS, O&amp;M, EPC, DECOMMISSIONING</p>
            <h2>Retiring solar panels? Start with a recycling plan.</h2>
            <p>See who the service is for, which facts have to be confirmed, how a project would move, and how fees are structured. No price is calculated on that page.</p>
            <PreserveFallback href="/services/solar-panel-recycling" intent="service">Check service options</PreserveFallback>
          </article>
          <article className="pc-hook" id="equipment-path">
            <p className="pc-eyebrow">RECYCLERS, WASTE OPERATORS, NEW U.S. ENTRANTS</p>
            <h2>Could PV recycling work for your business?</h2>
            <p>Read the published process, configuration names, and the limits that are still open. The business-case link goes to the separate calculator and does not promise a result.</p>
            <div className="pc-inline-links">
              <PreserveFallback href="/equipment/pv-circulator" intent="equipment">Explore PV Circulator</PreserveFallback>
              <PreserveFallback href="/equipment/pv-circulator#business-case" intent="equipment" secondary>Build a business case</PreserveFallback>
            </div>
          </article>
        </div>
      </section>

      <section className="pc-section pc-wrap pc-split">
        <figure className="pc-photo-frame">
          <img src="/PVCirconomy/images/feedstock-intact.png" alt="Intact retired solar panels pictured in the company brochure" />
          <figcaption>Intact panels from existing company material. Condition on your site still has to be confirmed.</figcaption>
        </figure>
        <div className="pc-prose">
          <p className="pc-eyebrow">WHAT THE NEXT STEP CAN AND CANNOT DO</p>
          <h2>A clear task. Then the conditions.</h2>
          <p>Panel owners can draft the facts a reviewer needs. Equipment visitors can read what is published and what is not measured. Neither path creates a quote, an order, or a contact.</p>
          <p><a className="pc-text-link" href="/PVCirconomy/evidence/">See the evidence index</a></p>
          <p><a className="pc-text-link" href="/PVCirconomy/replus/">RE+ entry, with no booth or dates claimed</a></p>
        </div>
      </section>
    </Shell>
  );
}

function PreserveFallback({ href, intent, children, secondary = false }: { href: string; intent: 'service' | 'equipment'; children: string; secondary?: boolean }) {
  const className = 'pc-button' + (secondary ? ' pc-button-secondary' : '');
  return (
    <Suspense fallback={<a className={className} href={'/PVCirconomy' + href}>{children}</a>}>
      <PreserveContextLink className={className} href={href} intent={intent}>{children}</PreserveContextLink>
    </Suspense>
  );
}
