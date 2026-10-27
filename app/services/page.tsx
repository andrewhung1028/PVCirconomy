import { RecyclingExplorer } from '../components/recycling-explorer';
import { Action, Shell } from '../components/marketing';
export const metadata = { title: 'Recycling services | PV Circonomy' };
const questions = [
 ['What panels can I recycle?', 'Share the panel technology, condition, dimensions and quantity at booking. Acceptance is confirmed for the selected service. Damaged, thin-film and unknown panel types require assessment.'],
 ['How is the price calculated?', 'Start with the reference scenario, then confirm your actual model, quantity, site and logistics at booking. The current rates and trailer capacity are illustrative assumptions, not commercial quotes.'],
 ['What should I prepare for pickup?', 'At booking, provide the pickup address, pallet count, packaging status, loading equipment and truck access details. The estimate screen keeps these details for the next step.'],
 ['When should I consider Project Support?', 'Projects exceeding 1 MW may be assessed for on-site or near-site recycling, integrated decommissioning, transport planning and staged or multi-site work. Support covers California and locations beyond California, subject to project feasibility. Exceeding 1 MW does not guarantee acceptance.'],
 ['What if my panels are outside California?', 'Transport outside California requires a manual logistics review. Project Support is assessed only for projects exceeding 1 MW; smaller shipments can be reviewed as transport inquiries without a Project Support commitment.'],
 ['What records are available?', 'Agree the required recycling, traceability and reporting records before booking. Documentation depends on the selected service and confirmed project scope.'],
];
export default function Services() {
 return <Shell>
  <section id="services-overview" className="pc-services-overview">
   <div className="pc-intro pc-wrap"><p className="pc-eyebrow">SERVICES / FOR PANEL OWNERS & DECOMMISSIONERS</p><h1>Your panels. A clear next step.</h1><p className="pc-lead">Choose drop-off or pickup for routine recycling. For projects above 1 MW, explore a tailored recycling plan in California and beyond.</p></div>
   <div className="pc-wrap pc-actions pc-intro-actions"><Action href="#recycling-options">Calculate a recycling estimate</Action><Action href="/shop?type=recycling" secondary>Book recycling</Action></div>
   <figure className="pc-editorial pc-editorial-figure"><img className="pc-editorial-image" src="/PVCirconomy/images/solar-circularity.png" alt="Illustrative retired solar panels prepared for recycling" loading="lazy"/><figcaption>Illustrative solar circularity imagery</figcaption></figure>
  </section>
  <RecyclingExplorer/>
  <section id="faq" className="pc-section pc-wrap pc-faq"><p className="pc-eyebrow">BEFORE YOU BOOK</p><h2>A few useful answers.</h2>{questions.map(([question,answer])=><details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</section>
 </Shell>;
}
