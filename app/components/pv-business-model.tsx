import Link from "next/link";
import type { WheelEventHandler } from "react";
import type { EquipmentPurchaseOption } from "../../lib/equipment-mou";
import type { PublicSolutionMarket } from "../../lib/our-solution/market";

const trialTerms = [
  {
    title: "Eligibility and markets",
    description: "TBP is open to recyclers with a valid solar PV panel recycling permit for projects in the United States, Australia, the European Union, the United Kingdom and Canada. Projects in Japan use standard purchase.",
  },
  {
    title: "Site and power",
    description: "Identify the trial site and check its power supply against the equipment specifications. If power availability is still uncertain, discuss it with us during project review.",
  },
  {
    title: "Trial period and acceptance",
    description: "The trial lasts up to 180 days. Before it starts, both parties agree on the acceptance criteria. Use your own panels to measure throughput, weigh the recovered materials and compare their offtake value with your operating costs.",
  },
  {
    title: "Quotation and contract",
    description: "Submit an inquiry and confirm the MOU. The formal quotation specifies the trial fee, any applicable deposit, the agreed duration and available slots. Both parties confirm the quotation in writing before proceeding to contract.",
  },
  {
    title: "Delivery and return freight",
    description: "Delivery is FOB Taiwan port. The buyer pays outbound freight, duties and import fees. If the equipment is returned because it fails to meet the agreed acceptance criteria, the seller pays return freight.",
  },
  {
    title: "Recovered materials during the trial",
    description: "You can request offtake for materials produced by your PV Circulator during the trial. We confirm availability for your site during project review. The offtake agreement sets the material specifications, minimum quantities and pricing. Glass offtake is available only in the United States.",
  },
];

export function PVCirculatorBusinessModel({ market, t, onPurchase, onPaneWheel, hasRecyclingPermit, onPermitChange }: {
  market: PublicSolutionMarket;
  hasRecyclingPermit: boolean;
  onPermitChange: (checked: boolean) => void;
  t: (text: string) => string;
  onPurchase: (option: EquipmentPurchaseOption) => void;
  onPaneWheel: WheelEventHandler<HTMLDivElement>;
}) {
  const applyLabel = t("Apply for a Trial-based PO");
  const trialOffered = market !== "JP";

  return <section id="business-model" className="pv-screen pvc2-split pvc2-split-64 pvc2-business-model" aria-labelledby="business-model-title">
    <div className="pvc2-split-copy pvc2-business-purchase" tabIndex={0} role="region" aria-labelledby="business-model-title" onWheel={onPaneWheel}>
      <div>
        <h2 id="business-model-title">{t("Bring PV Circulator to your site.")}</h2>
        <p>{t("Can the line reliably separate the panels you receive? Who will take the outputs, and will the revenue cover your costs? If you already know which configuration you need, you can buy it directly.")}</p>
        {trialOffered && <article className="pvc2-purchase-option">
          <div className="os-materials-demand">
            <strong aria-hidden="true">{t("Up to 180 days")}</strong>
            <h3>{t("Trial-based PO (TBP)")}</h3>
          </div>
          <p>{t("Try PV Circulator with your own panels for up to 180 days. Measure throughput, weigh the recovered materials and compare their offtake value with your operating costs. Use those results to judge whether the line works for your business.")}</p>
          <details className="pv-details">
            <summary>{t("TBP terms")}</summary>
            <dl className="pvc2-trial-terms">
              {trialTerms.map(({ title, description }) => <div key={title}>
                <dt><strong>{t(title)}</strong></dt>
                <dd>{t(description)}</dd>
              </div>)}
            </dl>
          </details>
          <label className="pvc2-trial-permit">
            <input type="checkbox" checked={hasRecyclingPermit}
              onChange={event => onPermitChange(event.currentTarget.checked)} />
            {t("Our organization holds a valid permit to recycle solar PV panels.")}
          </label>
          {hasRecyclingPermit
            ? <Link className="pv-button pvc2-quote-button" href={`?market=${market}&inquiry=1&purchase=tbp#specification`}
                onNavigate={() => onPurchase("Trial-based PO (TBP)")}>{applyLabel}</Link>
            : <button type="button" className="pv-button pvc2-quote-button" disabled>{applyLabel}</button>}
        </article>}
      </div>
    </div>

    <div className="pvc2-split-scroll pvc2-business-offtake" tabIndex={0} role="region" aria-labelledby="business-offtake-title" onWheel={onPaneWheel}>
      <h2 id="business-offtake-title">{t("Who will take the recovered materials?")}</h2>
      <p>{t("Local demand varies by market. Even after EVA is de-crosslinked, a recycler may be far from footwear manufacturers in Southeast Asia that can use it. A small batch may be worth less than it costs to ship.")}</p>
      <p>{t("PV Circonomy buys qualifying cell powder and arranges offtake for EVA and backsheets from your PV Circulator. You can ship materials that meet the agreed specifications without secondary treatment. Keeping them out of landfill and incineration can reduce disposal costs and associated carbon emissions.")}</p>
      <dl className="pvc2-offtake-list">
        {market === "US" && <div>
          <dt>{t("Glass")}</dt>
          <dd>{t("Glass accounts for about 70% of a panel’s weight. In the US, we also take qualifying glass without a secondary treatment fee. You pay freight and ship a full trailer or container, about 1,500 panels’ worth of glass per load.")}</dd>
        </div>}
        <div>
          <dt>{t("Cell powder")}</dt>
          <dd>{t("We buy qualifying cell powder. The agreement sets how assay results, market prices, the payable rate and treatment charges determine what you receive.")}</dd>
        </div>
        <div>
          <dt>{t("Backsheet and EVA")}</dt>
          <dd>{t("We accept qualifying backsheet and EVA free of charge, giving you an outlet for both polymer streams.")}</dd>
        </div>
      </dl>
      <details className="pv-details">
        <summary>{t("Offtake eligibility and terms")}</summary>
        <p>{t(trialOffered
          ? "Guaranteed offtake is available to customers who purchase PV Circulator or enter a Trial-based PO. We take materials produced by PV Circulator that meet the agreed specifications."
          : "Guaranteed offtake is available to customers who purchase PV Circulator. We take materials produced by PV Circulator that meet the agreed specifications.")}</p>
        <p>{t("Supported markets are the United States, Australia, the European Union, the United Kingdom, Canada and Japan. Glass offtake is offered in the United States only.")}</p>
        <p>{t("PV Circonomy arranges the offtake partners and confirms site availability during project review. The offtake agreement sets eligible markets, material specifications, minimum quantities and pricing.")}</p>
      </details>
    </div>
  </section>;
}
