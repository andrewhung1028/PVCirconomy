import { Suspense } from 'react';
import { BusinessCaseLink, IntentBeacon } from '../../components/context-links';
import '../../components/journey.css';
import { ScenarioReview, TechnicalRequestForm } from '../../components/equipment-tools';
import { Shell } from '../../components/marketing';

export const metadata = {
  title: 'PV Circulator | PV Circonomy',
  description: 'Published PV Circulator process, configuration names, limits, and a link to the separate business-case calculator. Nominal figures are not new measured results.',
};

export default function PvCirculatorPage() {
  return (
    <Shell>
      <Suspense fallback={null}><IntentBeacon /></Suspense>
      <article className="pc-journey">
        <header className="pc-journey-hero pc-wrap">
          <p className="pc-eyebrow">EQUIPMENT / PV CIRCULATOR</p>
          <h1>Could PV recycling work for your business?</h1>
          <p className="pc-lead">Start with the published process and the conditions that still have to be confirmed. Then open the separate calculator if you want to test assumptions. This page does not produce a return, a quote, or an operating permit.</p>
        </header>
        <div className="pc-wrap">
          <nav className="pc-journey-nav" aria-label="On this page">
            <a href="#process">Process</a>
            <a href="#configurations">Configurations</a>
            <a href="#outputs">Material outputs</a>
            <a href="#limits">Limits</a>
            <a href="#scenario">Scenario review</a>
            <a href="#business-case">Business case</a>
            <a href="#technical-request">Technical request</a>
          </nav>

          <section className="pc-journey-section pc-split" id="process">
            <figure className="pc-photo-frame">
              <img src="/PVCirconomy/images/pv-circulator-system.png" alt="PV Circulator modular equipment system from the company brochure" />
              <figcaption>Equipment image from existing company material. It is not a measured test setup.</figcaption>
            </figure>
            <div className="pc-prose">
              <h2>Process</h2>
              <p>Public company material describes PV Circulator as a dry, physical, layer-by-layer separation process, and says that description does not use water, chemicals, or thermal treatment. That is a published description. It is not a new test result from this website.</p>
              <p>The public specification sheet also states nominal figures for throughput, recovery, energy, operators, and consumables. Those figures stay on the evidence index, labeled as nominal and not independently measured. They are not repeated here as guarantees.</p>
              <p><a href="/PVCirconomy/evidence/">Open the evidence index</a></p>
            </div>
          </section>

          <section className="pc-journey-section" id="configurations">
            <h2>Configurations and operating conditions</h2>
            <div className="pc-spec-grid">
              <article>
                <p className="pc-kicker">Published name</p>
                <h3>Economic</h3>
                <p>Described on the public site as a focused entry configuration for essential processing, including core infeed and frame removal. The stages included in a real proposal still have to be listed.</p>
              </article>
              <article>
                <p className="pc-kicker">Published name</p>
                <h3>Basic</h3>
                <p>Described as a more complete separation flow, including two delamination stages and automated discharge. Completion of those stages is a proposal item, not a promise from this page.</p>
              </article>
              <article>
                <p className="pc-kicker">Published name</p>
                <h3>Premium</h3>
                <p>Described with identification, measurement, automatic junction-box removal, and module-level records. Traceability is described, not demonstrated with a live record here.</p>
              </article>
              <article>
                <p className="pc-kicker">Feedstock</p>
                <h3>What the public page allows as options</h3>
                <p>Intact panels are the base description. Broken and bifacial panels are named as additional options. That does not mean every configuration accepts every condition.</p>
              </article>
            </div>
          </section>

          <section className="pc-journey-section" id="outputs">
            <h2>Material outputs</h2>
            <div className="pc-spec-grid">
              {[
                ['Glass', 'The largest material stream. Shown as a category, not as a purity specification.'],
                ['Aluminum', 'Separated frame material for a later metal process. Form and buyer requirements are batch-specific.'],
                ['Copper-bearing material', 'A conductor fraction. Further refining is outside the description on this page.'],
                ['Cell material', 'Recovered cell material for an application-specific evaluation. Not a purity claim and not whole-panel reuse.'],
              ].map(([title, body]) => (
                <article key={title}>
                  <img src={`/PVCirconomy/images/material-${title === 'Copper-bearing material' ? 'copper' : title === 'Cell material' ? 'silicon' : title.toLowerCase()}.svg`} alt="" />
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
            <p className="pc-fine">Category illustrations are original drawings, not photographs of a tested batch. JB Tool specifications are pending and are not listed as a Circulator output. <a href="/PVCirconomy/equipment/jbtool/">Read the JB Tool status</a>.</p>
          </section>

          <section className="pc-journey-section" id="limits">
            <div className="pc-prose">
              <h2>Limits that are still open</h2>
              <ul>
                <li>Permitted sites, utilities, and local storage rules are not confirmed here. A storage quantity, if one is later published, is not the same thing as processing capacity.</li>
                <li>No U.S.-wide permission to install or operate the equipment is stated.</li>
                <li>CE, SGS, and other certificates are not stated because this preview does not have an approved public source for them.</li>
                <li>Throughput, recovery, energy, and carbon figures on the existing public pages are nominal published figures. Test date, feedstock, and method are missing from this repository’s website copy.</li>
              </ul>
            </div>
          </section>

          <section className="pc-journey-section" id="scenario">
            <div className="pc-prose">
              <h2>Review a published scenario</h2>
              <p>Marking a scenario keeps a note on this page. It does not open a commercial case.</p>
            </div>
            <ScenarioReview />
          </section>

          <section className="pc-journey-section" id="business-case">
            <div className="pc-prose">
              <h2>Build a business case</h2>
              <p>The calculator is the existing site at businesscase.pvcirconomy.com. This repository does not change that tool. Opening it does not promise a finished calculation, a 60-second result, or a return.</p>
              <p>Public use of that calculator has shown some calculations blocked when operating days per month and hours per day are missing. This page does not confirm the root cause.</p>
              <p>A separate calculator request is to test selling prices from 30 to 100 percent of virgin-material prices. That is a selling-price assumption. It is not a recovery yield, a purity result, a whole-panel reuse rate, or a guaranteed market price. Benchmarks already in the calculator are not all virgin prices. No price or return is calculated on this website.</p>
            </div>
            <Suspense fallback={<a className="pc-button" href="https://businesscase.pvcirconomy.com/?utm_source=pvcirconomy_preview&utm_medium=referral&utm_campaign=equipment_journey&intent=equipment">Build a business case</a>}>
              <BusinessCaseLink>Build a business case</BusinessCaseLink>
            </Suspense>
          </section>

          <section className="pc-journey-section" id="technical-request">
            <div className="pc-prose">
              <h2>Ask for a technical assessment</h2>
              <p>For an existing recycler, a waste operator, or a new U.S. entrant. The form shows what would be asked. It does not open an assessment file.</p>
            </div>
            <TechnicalRequestForm />
          </section>
        </div>
      </article>
    </Shell>
  );
}
