import '../../components/journey.css';
import { Shell } from '../../components/marketing';

export const metadata = {
  title: 'JB Tool | PV Circonomy',
  description: 'JB Tool is in the equipment portfolio. Published functions and specifications are pending review.',
};

export default function JbToolPage() {
  return (
    <Shell>
      <article className="pc-journey">
        <header className="pc-journey-hero pc-wrap">
          <p className="pc-eyebrow">EQUIPMENT / PENDING REVIEW</p>
          <h1>JB Tool</h1>
          <p className="pc-lead">JB Tool is part of the equipment portfolio. Published functions and specifications have not been approved for this page, so none are stated.</p>
        </header>
        <div className="pc-wrap pc-journey-section">
          <div className="pc-spec-grid">
            <article>
              <p className="pc-tag pc-tag-warn">Pending review</p>
              <h2>What can be said</h2>
              <p>The name is public enough to list beside PV Circulator. A visitor who needs the tool can ask for a technical conversation. That conversation is not started by this page.</p>
            </article>
            <article>
              <p className="pc-tag pc-tag-warn">Not approved</p>
              <h2>What is not said</h2>
              <p>No function, throughput, compatibility, purity, certificate, or safety limit is published here. Automatic junction-box removal is described separately as a Premium PV Circulator feature. This page does not assert that JB Tool is that feature.</p>
            </article>
          </div>
          <p className="pc-fine">When an approved public specification exists, it should replace this notice and be added to the evidence index with its date and conditions.</p>
          <div className="pc-inline-links">
            <a className="pc-button" href="/PVCirconomy/equipment/pv-circulator/#technical-request">Request a technical review</a>
            <a className="pc-button pc-button-secondary" href="/PVCirconomy/evidence/#jb-tool">See the approval gap</a>
          </div>
        </div>
      </article>
    </Shell>
  );
}
