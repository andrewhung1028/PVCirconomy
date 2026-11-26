import {ResidentialNote} from '../components/residential-note';
import { Action, Shell } from '../components/marketing';
export const metadata = { title: 'Recycling services | PV Circonomy' };
const questions = [
 ['What panels can I recycle?', 'Share the panel technology, condition, dimensions and quantity at booking. Acceptance is confirmed for the selected service. Damaged, thin-film and unknown panel types require assessment.'],
 ['How is the price calculated?', 'Pricing depends on panel wattage, quantity and condition. Confirmed examples are available on the estimate page; other rates require review. Transport is separate and estimates are not binding quotes.'],
 ['What should I prepare for pickup?', 'At booking, provide the pickup address, pallet count, packaging status, loading equipment and truck access details. Pickup availability and logistics require confirmation.'],
 ['When should I consider Project Support?', 'Projects exceeding 1 MW may be assessed for on-site or near-site recycling, integrated decommissioning, transport planning and staged or multi-site work. Support covers California and locations beyond California, subject to project feasibility. Exceeding 1 MW does not guarantee acceptance.'],
 ['What if my panels are outside California?', 'Transport outside California requires a manual logistics review. Project Support is assessed only for projects exceeding 1 MW; smaller shipments can be reviewed as transport inquiries without a Project Support commitment.'],
 ['What records are available?', 'Agree the required recycling, traceability and reporting records before booking. Documentation depends on the selected service and confirmed project scope.'],
];
export default function Services() {
 return <Shell>
  <section id="services-overview" className="pc-services-overview">
   <div className="pc-intro pc-wrap"><p className="pc-eyebrow">SERVICES / FOR PANEL OWNERS & DECOMMISSIONERS</p><h1>Your panels. A clear next step.</h1><p className="pc-lead">Choose drop-off or pickup for routine recycling. For projects above 1 MW, explore a tailored recycling plan in California and beyond.</p></div>
   <div className="pc-wrap pc-actions pc-intro-actions"><Action href="/recycling-estimate">Calculate a recycling estimate</Action><Action href="#faq" secondary>Review recycling FAQs</Action></div>
   <figure className="pc-editorial pc-editorial-figure"><img className="pc-editorial-image" src="/images/solar-circularity.png" alt="Illustrative retired solar panels prepared for recycling" loading="lazy"/><figcaption>Illustrative solar circularity imagery</figcaption></figure>
  </section>
  <section id="recycling-options" className="pc-section pc-wrap"><h2>Transparent processing costs.</h2><p><ResidentialNote/> Truck shipments are priced per panel. Trailer shipments settle on scale weight, including pallets and packaging. Transport is quoted separately. Complete model and volume tiers are still being configured.</p><div className="pc-actions"><Action href="/recycling-estimate">Explore recycling estimates</Action></div></section>
  <section id="faq" className="pc-section pc-wrap pc-faq"><p className="pc-eyebrow">BEFORE YOU BOOK</p><h2>A few useful answers.</h2>{questions.map(([question,answer])=><details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</section>
 </Shell>;
}
