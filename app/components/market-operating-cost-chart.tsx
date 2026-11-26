import type { CSSProperties } from "react";
import type { EconomicsView as OurSolutionView } from "../../lib/our-solution-data";
import type { OurSolutionLocale } from "../../lib/our-solution/market";

const copy = {
  "en-US": {
    title: "Modeled operating cost per MW",
    note: "Based on each recycling method’s modeled operating expenses. Transport, taxes, capital expenditure and depreciation are excluded.",
    shredding: "Shredding",
    thermal: "Thermal processing",
  },
  "zh-TW": {
    title: "每 MW 回收營運成本試算",
    note: "依各回收方式的模型營運成本計算。運輸、稅金、資本支出及折舊另計。",
    shredding: "破碎法",
    thermal: "熱處理法",
  },
  "ja-JP": {
    title: "1 MW 当たりのリサイクル運営費用の試算",
    note: "各リサイクル方式の運営費用に基づく試算です。輸送費、税金、設備投資、減価償却費は別途です。",
    shredding: "破砕処理",
    thermal: "熱処理",
  },
};

export function MarketOperatingCostChart({ data, watts, locale }: {
  data: OurSolutionView;
  watts: number;
  locale: OurSolutionLocale;
}) {
  const { currency, region } = data.scenario;
  const { title, note, shredding, thermal } = copy[locale];
  const labels = { SHREDDING: shredding, HOT_KNIFE: thermal, PVCIRCULATOR: "PV Circulator" };
  const styles = { SHREDDING: "is-shredding", HOT_KNIFE: "is-thermal", PVCIRCULATOR: "is-pv-circonomy" };
  const costs = data.solutions.map(solution => ({
    code: solution.code,
    value: (solution.opexPerPanel.total * 1e6) / watts,
  }));
  const max = Math.max(1, ...costs.map(cost => cost.value)) * 1.16;
  const money = new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "code", maximumFractionDigits: 0 });

  return <figure className="os-cost-benchmark">
    <figcaption><strong>{title}</strong><span>{region} · {watts} W · {currency}</span></figcaption>
    <div className="os-cost-plot"><div className="os-cost-columns">
      {costs.map(({ code, value }) => <div key={code} className={`os-cost-column ${styles[code]}`} style={{ "--bar": `${value / max * 100}%` } as CSSProperties}>
        <strong>{money.format(value)}</strong><i aria-hidden="true" /><span>{labels[code]}</span>
      </div>)}
    </div></div>
    <small>{note}</small>
  </figure>;
}
