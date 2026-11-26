import Link from "next/link";
import type { WheelEventHandler } from "react";
import type { EquipmentPurchaseOption } from "../../lib/equipment-mou";
import type { PublicSolutionMarket } from "../../lib/our-solution/market";

const materials = [
  {
    name: "Glass",
    terms: ["Free offtake", "United States only"],
    details: [
      "We accept qualifying glass produced by PV Circulator in the United States. The recycler pays freight and ships full trailer or container loads, equivalent to about 1,500 panels per load.",
      "Qualifying glass is accepted without a secondary treatment fee.",
    ],
  },
  {
    name: "Cell powder",
    terms: ["Paid offtake"],
    details: [
      "We buy qualifying cell powder produced by PV Circulator in all supported markets.",
      "The offtake agreement sets the pricing formula using assay results, market prices, a payable rate and treatment charges.",
    ],
  },
  {
    name: "Backsheet and EVA",
    terms: ["Free offtake"],
    details: [
      "We accept backsheet and EVA produced by PV Circulator in all supported markets when they meet the agreed specifications.",
    ],
  },
];

export function PVCirculatorBusinessModel({ market, businessCaseHref, t, onPurchase, onPaneWheel }: {
  market: PublicSolutionMarket;
  businessCaseHref: string;
  t: (text: string) => string;
  onPurchase: (option: EquipmentPurchaseOption) => void;
  onPaneWheel: WheelEventHandler<HTMLDivElement>;
}) {
  const trialOffered = market !== "JP";

  return <section id="business-model" className="pv-screen pvc2-split pvc2-split-43 pvc2-business-model" aria-labelledby="business-model-title">
    <div className="pvc2-split-copy pvc2-business-purchase" tabIndex={0} role="region" aria-labelledby="business-model-title" onWheel={onPaneWheel}>
      <div>
        <p className="pvc2-business-label">{t("Business model")}</p>
        <h2 id="business-model-title">{t("Buy a PV Circulator line.")}</h2>
        <div className="pvc2-business-purchase-options">
          <article className="pvc2-business-card">
            <h3>{t("Standard purchase")}</h3>
            <p>{t("For recyclers ready to purchase a PV Circulator line configured for their operation.")}</p>
            <p>{t("Start with an inquiry. After we confirm the MOU, we issue a formal quotation and then proceed to a purchase contract.")}</p>
            <Link className="pv-button" href={`?market=${market}&inquiry=1&purchase=standard#specification`}
              onNavigate={() => onPurchase("Standard sales")}>{t("Start a standard purchase inquiry")} <span aria-hidden="true">→</span></Link>
          </article>
          {trialOffered && <article className="pvc2-business-card">
            <h3>{t("Trial-based PO (TBP)")}</h3>
            <p>{t("For recyclers with a government permit for PV module dismantling or processing who want to evaluate the equipment against agreed acceptance criteria.")}</p>
            <p>{t("Delivery is FOB Taiwan port. The buyer pays outbound freight, duties and import fees. If the equipment is returned because it fails to meet the agreed acceptance criteria, the seller pays return freight.")}</p>
            <p>{t("Select TBP in the inquiry to start. An MOU is followed by a formal quotation and a contract. The quotation specifies the trial fee, duration and available slots.")}</p>
            <Link className="pv-button" href={`?market=${market}&inquiry=1&purchase=tbp#specification`}
              onNavigate={() => onPurchase("Trial-based PO (TBP)")}>{t("Apply for a Trial-based PO")} <span aria-hidden="true">→</span></Link>
          </article>}
        </div>
        <p className="pvc2-business-market-note">{t("Projects in Japan use Standard purchase.")}</p>
        <a className="pv-text-button pvc2-business-case-link" href={businessCaseHref}>{t("Run your business case")} <span aria-hidden="true">→</span></a>
      </div>
    </div>

    <div className="pvc2-split-scroll pvc2-business-offtake" tabIndex={0} role="region" aria-labelledby="business-offtake-title" onWheel={onPaneWheel}>
      <header className="pvc2-section-heading">
        <h2 id="business-offtake-title">{t("We help you sell what you recover.")}</h2>
        <p>{t(trialOffered
          ? "Guaranteed offtake is available to customers who purchase PV Circulator or enter a Trial-based PO. We take materials produced by PV Circulator that meet the agreed specifications."
          : "Guaranteed offtake is available to customers who purchase PV Circulator. We take materials produced by PV Circulator that meet the agreed specifications.")}</p>
      </header>
      <div className="pvc2-business-materials">
        {materials.map(({ name, terms, details }) => <article className="pvc2-business-card" key={name}>
          <p className="pvc2-business-label">{terms.map(term => <span key={term}>{t(term)}</span>)}</p>
          <h3>{t(name)}</h3>
          {details.map(detail => <p key={detail}>{t(detail)}</p>)}
        </article>)}
      </div>
      <div className="pvc2-business-steps">
        <h3>{t("How it works")}</h3>
        <ol>
          <li>{t(trialOffered ? "Purchase PV Circulator or start a Trial-based PO." : "Purchase PV Circulator.")}</li>
          <li>{t("Process panels on PV Circulator to the agreed specifications.")}</li>
          <li>{t("PV Circonomy takes the qualifying materials.")}</li>
        </ol>
      </div>
      <div className="pvc2-business-terms">
        <p>{t("Supported markets are the United States, Australia, the European Union, the United Kingdom, Canada and Japan. Glass offtake is offered in the United States only.")}</p>
        <p>{t("PV Circonomy arranges the offtake partners and confirms site availability during project review. The offtake agreement sets eligible markets, material specifications, minimum quantities and pricing.")}</p>
      </div>
    </div>
  </section>;
}
