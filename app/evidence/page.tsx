import { Suspense } from 'react';
import { EvidenceBeacon } from '../components/context-links';
import '../components/journey.css';
import { Shell } from '../components/marketing';
import { approvalChecklist, evidenceIndex } from '@/lib/journey/evidence';

export const metadata = {
  title: 'Evidence index | PV Circonomy',
  description: 'Public sources, nominal figures, and claims that are not independently verified.',
};

const kindLabel = {
  'nominal-published': 'Nominal published figure',
  'described-not-measured': 'Described, not measured here',
  'not-approved': 'Not approved to state as verified',
} as const;

export default function EvidencePage() {
  return (
    <Shell>
      <Suspense fallback={null}><EvidenceBeacon sourceId="evidence-index" /></Suspense>
      <article className="pc-journey">
        <header className="pc-journey-hero pc-wrap">
          <p className="pc-eyebrow">EVIDENCE</p>
          <h1>What is public, and what is not verified</h1>
          <p className="pc-lead">Company pages and the 2026 brochure are public sources. They are not the same thing as an independent measurement. Where a test date or method is missing, this index says so.</p>
        </header>
        <div className="pc-wrap">
          <section className="pc-evidence-list" aria-label="Evidence index">
            {evidenceIndex.map(item => (
              <article className="pc-evidence-card" id={item.id} key={item.id}>
                <p className="pc-tag">{kindLabel[item.kind]}</p>
                <h2>{item.topic}</h2>
                <p>{item.publicStatement}</p>
                <dl className="pc-summary-dl">
                  <dt>Source</dt><dd>{item.source}</dd>
                  <dt>Nominal or measured</dt><dd>{item.nominalOrMeasured}</dd>
                  <dt>Independent verification</dt><dd>Not established on this website.</dd>
                  <dt>Test date</dt><dd>Not available in this index.</dd>
                  <dt>Test conditions</dt><dd>{item.testConditions}</dd>
                  <dt>Missing</dt><dd>{item.missing}</dd>
                </dl>
              </article>
            ))}
          </section>
          <section className="pc-journey-section" id="approval">
            <h2>Claims pending approval</h2>
            <p className="pc-prose">These items stay off the site as verified claims until an approved public source exists. Private notes are not copied here.</p>
            <ul className="pc-note-list">
              {approvalChecklist.map(item => <li key={item}><strong>Needs an approved public source.</strong> {item}</li>)}
            </ul>
            <p className="pc-fine">Brochure PDF already published with the site: <a href="/PVCirconomy/2026_PV_Circulator_Solution_Brochure.pdf">PV Circulator Solution Brochure (2026)</a>. The website attribution points to pages 4–6 for the specification sheet. This preview did not re-measure those pages.</p>
          </section>
        </div>
      </article>
    </Shell>
  );
}
