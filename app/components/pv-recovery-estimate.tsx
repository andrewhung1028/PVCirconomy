import type { OurSolutionLocale } from "../../lib/our-solution/market";
import type { PVCirculatorRecovery, PVCirculatorReference } from "./pv-circulator-route-data";

const streams = [
  { label: "Glass", includes: ["Glass"], pathway: "Glass Pozzolan" },
  { label: "Aluminum frames", includes: ["Aluminium"], pathway: "Recycled aluminum feedstock" },
  { label: "Cell powder (silicon and silver)", includes: ["Silicon", "Silver"], pathway: "Direct cell-powder sale to a refiner" },
  { label: "Copper ribbons", includes: ["Copper"], pathway: "Recycled copper feedstock" },
  { label: "Polymers (EVA and backsheet)", includes: ["EVA", "Backsheet"], pathway: "Free offtake service" },
  { label: "Junction boxes and cables", includes: ["Junction box"], pathway: "Downstream metal and plastic recovery" },
  { label: "Other recovered material", includes: ["Residual / mixed fraction"], pathway: "Downstream treatment, subject to acceptance" },
];

function ValueCell({ value, format }: { value: number | null; format: Intl.NumberFormat }) {
  return <td className={value !== null && value < 0 ? "negative" : undefined}>
    {value === null ? "—" : format.format(value || 0)}
  </td>;
}

export function RecoveryEstimate({ recovery, reference, annualPanels, locale, t }: {
  recovery?: PVCirculatorRecovery;
  reference?: PVCirculatorReference;
  annualPanels: number | null;
  locale: OurSolutionLocale;
  t: (english: string) => string;
}) {
  const rows = recovery && streams.map(stream => {
    const materials = recovery.materials.filter(material => stream.includes.includes(material.name));
    return {
      ...stream,
      tonnesPerPanel: materials.reduce((sum, material) => sum + material.recoveredTonnesPerPanel, 0),
      revenuePerPanel: materials.reduce((sum, material) => sum + material.revenuePerPanel, 0),
    };
  }).filter(stream => stream.tonnesPerPanel > 0);

  const grossPerPanel = rows?.reduce((sum, row) => sum + row.revenuePerPanel, 0) ?? 0;
  const residueCostPerPanel = recovery?.residualCostPerPanel ?? 0;
  const residueCostPerTonne = recovery?.residualTonnesPerPanel ? residueCostPerPanel / recovery.residualTonnesPerPanel : null;
  const unitValue = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const annualValue = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  return <section className="pvc2-recovery-estimate" aria-labelledby="pvc2-recovery-title">
    <h3 id="pvc2-recovery-title">{t("Estimated material recovery and value")}</h3>
    {!rows || !reference || !recovery ? <p>{t("Material recovery estimates are unavailable for this market.")}</p> : annualPanels === null
      ? <p>{t("Enter a valid operating schedule in Performance to see the material estimate.")}</p> : <>
        <p>{t("Based on the annual throughput from Performance and the selected market’s Our Solution material mix, recovery rates and prices.")}</p>
        <p>
          <strong>{Math.round(annualPanels).toLocaleString(locale)} {t("panels/year")}</strong>
          {" · "}{reference.region}{" · "}{reference.currency}
        </p>
        <div className="pvc2-recovery-table" role="region" aria-labelledby="pvc2-recovery-title" tabIndex={0}>
          <table>
            <thead><tr><th scope="col">{t("Recovered stream")}</th><th scope="col">{t("Tonnes/year")}</th><th scope="col">{t("Typical downstream route")}</th><th scope="col">{t("Value per tonne")} ({reference.currency})</th><th scope="col">{t("Annual material value")} ({reference.currency})</th></tr></thead>
            <tbody>
              {rows.map(stream => <tr key={stream.label}>
                <th scope="row">{t(stream.label)}</th>
                <td>{unitValue.format(stream.tonnesPerPanel * annualPanels)}</td>
                <td>{t(stream.pathway)}</td>
                <ValueCell value={stream.revenuePerPanel / stream.tonnesPerPanel} format={unitValue} />
                <ValueCell value={stream.revenuePerPanel * annualPanels} format={annualValue} />
              </tr>)}
              <tr><th scope="row">{t("Process residue")}</th>
                <td>{unitValue.format(recovery.residualTonnesPerPanel * annualPanels)}</td>
                <td>{t("third-party 2nd treatment or disposal")}</td>
                <ValueCell value={residueCostPerTonne === null ? null : -residueCostPerTonne} format={unitValue} />
                <ValueCell value={-residueCostPerPanel * annualPanels} format={annualValue} /></tr>
            </tbody>
            <tfoot><tr>
              <th scope="row">{t("Total recovered material")}</th>
              <td>{unitValue.format(rows.reduce((sum, row) => sum + row.tonnesPerPanel, 0) * annualPanels)}</td><td /><td>—</td>
              <ValueCell value={grossPerPanel * annualPanels} format={annualValue} />
            </tr><tr>
              <th scope="row" colSpan={4}>{t("Material value after residue treatment")}</th>
              <ValueCell value={(grossPerPanel - residueCostPerPanel) * annualPanels} format={annualValue} />
            </tr></tfoot>
          </table>
        </div>
        <p className="pv-note">{t("Combined streams use a weight-based blended sale price. The residue charge uses the market’s modeled disposal rate. Net material value deducts this charge and excludes recycling fees, other operating costs and refining upside.")}</p>
      </>}
  </section>;
}
