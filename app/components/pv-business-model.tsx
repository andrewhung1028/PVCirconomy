import Link from "next/link";
import type { WheelEventHandler } from "react";
import type { EquipmentPurchaseOption } from "../../lib/equipment-mou";
import type { PublicSolutionMarket } from "../../lib/our-solution/market";

export function PVCirculatorBusinessModel({ market, t, onPurchase, onPaneWheel }: {
  market: PublicSolutionMarket;
  t: (text: string) => string;
  onPurchase: (option: EquipmentPurchaseOption) => void;
  onPaneWheel: WheelEventHandler<HTMLDivElement>;
}) {
  const trialOffered = market !== "JP";

  return <section id="business-model" className="pv-screen pvc2-split pvc2-split-64 pvc2-business-model" aria-labelledby="business-model-title">
    <div className="pvc2-split-copy pvc2-business-purchase" tabIndex={0} role="region" aria-labelledby="business-model-title" onWheel={onPaneWheel}>
      <div>
        <h2 id="business-model-title">{t("Bring PV Circulator to your site.")}</h2>
        <p>{t("Can the line reliably separate the panels you receive? Who will take the outputs, and will the revenue cover your costs? If you already know which configuration you need, you can buy it directly.")}</p>
        {trialOffered && <article className="pvc2-purchase-option">
          <div className="os-materials-demand">
            <strong aria-hidden="true">{t("180 days")}</strong>
            <h3>{t("Trial-based PO (TBP)")}</h3>
          </div>
          <p>{t("If you hold a government permit for PV module dismantling or processing, you can run a 180-day trial with your own panels and test PV Circulator against acceptance criteria agreed in advance. Measure throughput, weigh the recovered materials and compare their offtake value with your operating costs. Use those results to judge whether the line works for your business.")}</p>
          <details className="pv-details">
            <summary>{t("Trial terms, freight and returns")}</summary>
            <p>{t("After the MOU, the formal quotation sets out the trial fee and available slots before you sign the contract.")}</p>
            <p>{t("Delivery is FOB Taiwan port. The buyer pays outbound freight, duties and import fees. If the equipment is returned because it fails to meet the agreed acceptance criteria, the seller pays return freight.")}</p>
          </details>
          <Link className="pv-text-button" href={`?market=${market}&inquiry=1&purchase=tbp#specification`}
            onNavigate={() => onPurchase("Trial-based PO (TBP)")}>{t("Apply for a Trial-based PO")} <span aria-hidden="true">→</span></Link>
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
