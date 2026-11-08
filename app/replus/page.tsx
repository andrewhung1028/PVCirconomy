import { Suspense } from 'react';
import { IntentBeacon, PreserveContextLink } from '../components/context-links';
import '../components/journey.css';
import { Shell } from '../components/marketing';

export const metadata = {
  title: 'RE+ entry | PV Circonomy',
  description: 'A branching entry for people comparing panel recycling and recycling equipment. No RE+ edition, date, or booth is claimed.',
};

export default function ReplusPage() {
  return (
    <Shell>
      <Suspense fallback={null}><IntentBeacon /></Suspense>
      <article className="pc-journey">
        <header className="pc-journey-hero pc-wrap">
          <p className="pc-eyebrow">RE+ / TWO TASKS</p>
          <h1>Have panels to recycle—or a recycling business to build?</h1>
          <p className="pc-lead">RE+ is a U.S. solar industry gathering. This page does not confirm an edition, a city, dates, or a booth, and it does not say that we met.</p>
        </header>
        <div className="pc-wrap">
          <Suspense fallback={null}>
            <div className="pc-choice-grid">
              <PreserveContextLink className="pc-choice-card" href="/services/solar-panel-recycling" intent="service">
                <em>Service</em>
                <strong>Recycle my panels</strong>
                <span>Retiring solar panels? Start with a recycling plan.</span>
              </PreserveContextLink>
              <PreserveContextLink className="pc-choice-card" href="/equipment/pv-circulator" intent="equipment">
                <em>Equipment</em>
                <strong>Evaluate equipment</strong>
                <span>Could PV recycling work for your business?</span>
              </PreserveContextLink>
            </div>
          </Suspense>
          <section className="pc-journey-section pc-prose">
            <h2>If you opened this from a sign or a QR code</h2>
            <p>A scan opens the page. It is not consent to email, and it does not create a contact. A campaign link may carry a short campaign name. It should not carry your name, email, company, or ZIP.</p>
            <p>The two choices lead to the same service and equipment pages as the rest of the site. Service continues into conditions and a preview inquiry. Equipment continues into the published process, the evidence index, and the separate business-case calculator.</p>
            <p>Company-level measurement, if it is added later, would compare one clear offer at a time. Opens, clicks, and calculator visits would not be treated as leads. The useful results are a qualified company response, a valid project inquiry, an equipment assessment, fulfilled orders, and the staff time those take.</p>
            <p>This preview records none of that. The event names exist only in the page code and are not sent.</p>
          </section>
        </div>
      </article>
    </Shell>
  );
}
