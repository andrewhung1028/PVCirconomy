import { Suspense } from 'react';
import { IntentBeacon } from '../../components/context-links';
import '../../components/journey.css';
import { Shell } from '../../components/marketing';
import { ServiceIntake } from '../../components/service-intake';
import { SERVICE_STAGES } from '@/lib/journey/states';

export const metadata = {
  title: 'Solar panel recycling plan | PV Circonomy',
  description: 'Who the recycling service is for, what must be confirmed, how a project moves, and a preview inquiry that is not submitted.',
};

export default function SolarPanelRecyclingPage() {
  return (
    <Shell>
      <Suspense fallback={null}><IntentBeacon /></Suspense>
      <article className="pc-journey">
        <header className="pc-journey-hero pc-wrap">
          <p className="pc-eyebrow">SERVICES / SOLAR PANEL RECYCLING</p>
          <h1>Retiring solar panels? Start with a recycling plan.</h1>
          <p className="pc-lead">This page is for people who have panels to recycle. It explains the review path, the conditions, and the questions that still need a person. It does not confirm acceptance, a price, or a pickup.</p>
        </header>
        <div className="pc-wrap">
          <nav className="pc-journey-nav" aria-label="On this page">
            <a href="#who">Who it is for</a>
            <a href="#confirm">What must be confirmed</a>
            <a href="#flow">How a project moves</a>
            <a href="#fees">Fee structure</a>
            <a href="#logistics">Packaging and logistics</a>
            <a href="#exceptions">Exceptions</a>
            <a href="#inquiry">Preview inquiry</a>
          </nav>

          <section className="pc-journey-section" id="who">
            <div className="pc-prose">
              <h2>Who it is for</h2>
              <p>Solar asset owners, operations and maintenance teams, EPCs, and decommissioning contractors with panels to recycle in the United States. The useful first task is to describe the load well enough for a person to decide whether it can be accepted.</p>
              <p>Selecting a state does not mean service is available there. Current permits and an acceptance matrix are not verified for this page. A certificate, if one is later published, would not by itself authorize storage or processing nationwide.</p>
            </div>
          </section>

          <section className="pc-journey-section" id="confirm">
            <h2>What must be confirmed</h2>
            <div className="pc-spec-grid">
              {[
                ['Organization and work contact', 'Who owns the decision, and an email a reviewer can answer. A personal mailbox is allowed only as an exception for review.'],
                ['Origin', 'U.S. state and ZIP. The ZIP is checked against published prefixes. That check is not a coverage map.'],
                ['Transport', 'Pickup at the site, or drop-off if a receiving site is later confirmed. Neither choice schedules a truck.'],
                ['Panel type and condition', 'Crystalline silicon, thin-film, bifacial, mixed, or unknown. Intact, damaged, mixed, or unknown. Unknown is a valid answer.'],
                ['Quantity', 'A panel count, a weight with a unit, or both. The unit has to be pounds, kilograms, short tons, or metric tonnes.'],
                ['Packaging and loading', 'How the panels are packed. For pickup, how they can be loaded and the street address.'],
              ].map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}
            </div>
          </section>

          <section className="pc-journey-section" id="flow">
            <div className="pc-split">
              <div className="pc-prose">
                <h2>How a project moves</h2>
                <p>The future operating path is a qualified intake, a pending-review case, an approved versioned quote, customer acceptance, an order, confirmed logistics, and completion documents. Today the operation that this website can describe is a self-service inquiry plus human approval.</p>
                <p>Quote approval, acceptance, logistics, and documents need trusted records. A button in the browser cannot create them. The first submission, when a real intake exists, must remain pending review. It is not an order.</p>
              </div>
              <ol className="pc-stage-list">
                {SERVICE_STAGES.map((stage, index) => (
                  <li key={stage.id} aria-current={index === 0 ? 'step' : undefined}>
                    <strong>{index + 1}. {stage.label}</strong>
                    <span>{index === 0 ? 'You can draft this on the page. It is still not submitted.' : 'Locked. A trusted system and a person have to record this. This preview cannot.'}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="pc-journey-section" id="fees">
            <div className="pc-prose">
              <h2>Fee structure, without a price</h2>
              <p>No rate on this page is a quote. Illustrative per-panel figures exist in the older prototype calculator and are not repeated here. Payment terms and refund terms are not verified. Card numbers are not collected.</p>
            </div>
            <div className="pc-spec-grid">
              {[
                ['Review', 'Every inquiry. No fee is displayed. A person looks at the load before any number exists.'],
                ['Handling', 'Only if a service is later approved. The amount belongs on a versioned quote, not in this form.'],
                ['Transport', 'Pickup, or drop-off once a receiving site is named. It depends on origin, load, and access.'],
                ['Exceptions', 'Damaged, mixed, unknown, thin-film, or awkward packaging can change whether service is available and how it is priced.'],
                ['Documents', 'Records for a completed project would be issued after the work, from the system of record. This page does not issue them.'],
              ].map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}
            </div>
          </section>

          <section className="pc-journey-section" id="logistics">
            <div className="pc-prose">
              <h2>Packaging, logistics, and documents</h2>
              <p>Tell the reviewer whether panels are on pallets, in crates, loose, mixed, or unknown. Pickup planning needs the street address and the loading situation: forklift, dock, crane, none, or unknown. Drop-off does not ask for a street address because no receiving site is reserved here.</p>
              <p>The older prototype used Menifee, CA 92584 as a planning example. That is not confirmation that your load can be received there. Do not ship panels to PV Circonomy unless a person has confirmed the destination, the date, and the receiving conditions in writing.</p>
              <p>A preferred date can be included. It does not hold a truck or promise a window. Documents a completed project may later include are the intake record, the acceptance decision, the quote version, the transport confirmation, and a completion record. None of those are created here.</p>
            </div>
          </section>

          <section className="pc-journey-section" id="exceptions">
            <div className="pc-prose">
              <h2>Exceptions</h2>
              <p>Thin-film, damaged, mixed, and unknown panels are accepted into the draft and routed to review. They are not pre-approved. Missing photos, a personal email, a weight without a count, an unrecognized ZIP prefix, loose packaging, and any pickup request are also review items. They do not block you from seeing the preview summary once the required fields are coherent.</p>
            </div>
          </section>

          <section className="pc-journey-section" id="inquiry">
            <div className="pc-prose">
              <h2>Preview inquiry</h2>
              <p>Use this when you want to see the summary a reviewer would need. The result says “Preview reference — not submitted.” It is not a case number.</p>
            </div>
            <Suspense fallback={<p>Loading the preview form.</p>}>
              <ServiceIntake />
            </Suspense>
          </section>
        </div>
      </article>
    </Shell>
  );
}
