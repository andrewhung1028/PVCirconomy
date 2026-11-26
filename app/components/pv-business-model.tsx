import Link from "next/link";
import type { WheelEventHandler } from "react";
import type { EquipmentPurchaseOption } from "../../lib/equipment-mou";
import type { PublicSolutionMarket } from "../../lib/our-solution/market";

export function PVCirculatorBusinessModel({ market, businessCaseHref, t, onPurchase, onPaneWheel }: {
  market: PublicSolutionMarket;
  businessCaseHref: string;
  t: (text: string) => string;
  onPurchase: (option: EquipmentPurchaseOption) => void;
  onPaneWheel: WheelEventHandler<HTMLDivElement>;
}) {
  const trialOffered = market !== "JP";

  return <section id="business-model" className="pv-screen pvc2-split pvc2-split-64 pvc2-business-model" aria-labelledby="business-model-title">
    <div className="pvc2-split-copy pvc2-business-purchase" tabIndex={0} role="region" aria-labelledby="business-model-title" onWheel={onPaneWheel}>
      <div>
        <h2 id="business-model-title">{t("Bring PV Circulator to your site.")}</h2>
        <p>{t(trialOffered
          ? "Once you have a configuration in mind, the next question is whether you’re ready to order or need to test the line on the panels you process."
          : "Once you have a configuration in mind, use a standard purchase inquiry to confirm the equipment and terms for your site in Japan.")}</p>

        <article className="pvc2-purchase-option">
          <h3>{t("Standard purchase")}</h3>
          <p>{t("If you know your panel mix and target volume, go straight to a quotation for the line you need. Choose the level of automation and whether to add PLUS, so you can budget for the equipment your site will use.")}</p>
          <details className="pv-details">
            <summary>{t("From inquiry to purchase contract")}</summary>
            <p>{t("Start with an inquiry. After we confirm the MOU, we issue a formal quotation and then proceed to a purchase contract.")}</p>
          </details>
          <Link className="pv-text-button" href={`?market=${market}&inquiry=1&purchase=standard#specification`}
            onNavigate={() => onPurchase("Standard sales")}>{t("Start a standard purchase inquiry")} <span aria-hidden="true">→</span></Link>
        </article>
        {trialOffered && <article className="pvc2-purchase-option">
          <h3>{t("Trial-based PO (TBP)")}</h3>
          <p>{t("Will the line deliver the results you need with your panels? If you hold a government permit for PV module dismantling or processing, agree on acceptance criteria and test the equipment against them.")}</p>
          <details className="pv-details">
            <summary>{t("Trial terms, freight and returns")}</summary>
            <p>{t("Select TBP in the inquiry to start. An MOU is followed by a formal quotation and a contract. The quotation specifies the trial fee, duration and available slots.")}</p>
            <p>{t("Delivery is FOB Taiwan port. The buyer pays outbound freight, duties and import fees. If the equipment is returned because it fails to meet the agreed acceptance criteria, the seller pays return freight.")}</p>
          </details>
          <Link className="pv-text-button" href={`?market=${market}&inquiry=1&purchase=tbp#specification`}
            onNavigate={() => onPurchase("Trial-based PO (TBP)")}>{t("Apply for a Trial-based PO")} <span aria-hidden="true">→</span></Link>
        </article>}
        <a className="pv-text-button pvc2-business-case-link" href={businessCaseHref}>{t("Run your business case")} <span aria-hidden="true">→</span></a>
      </div>
    </div>

    <div className="pvc2-split-scroll pvc2-business-offtake" tabIndex={0} role="region" aria-labelledby="business-offtake-title" onWheel={onPaneWheel}>
      <h2 id="business-offtake-title">{t("Who will take the recovered materials?")}</h2>
      <p>{t("Before you invest, you need to know which outputs have a buyer and which could cost you money to move. PV Circonomy arranges offtake for materials your PV Circulator produces that meet the agreed specifications.")}</p>
      <dl className="pvc2-offtake-list">
        {market === "US" && <div>
          <dt>{t("Glass")}</dt>
          <dd>{t("In the US, qualifying glass is accepted without a secondary treatment fee. You cover freight and ship full trailer or container loads, about 1,500 panels’ worth of glass per load.")}</dd>
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
