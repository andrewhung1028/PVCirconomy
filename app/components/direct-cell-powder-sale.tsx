import type { EconomicsView } from "../../lib/our-solution-data";

export function DirectCellPowderSale({
  rates,
  locale,
}: {
  rates: EconomicsView["cellPowder"]["directSaleRealization"];
  locale: "en-US" | "ja-JP" | "zh-TW";
}) {
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 });
  const silver = percent.format(rates.silver);
  const silicon = percent.format(rates.silicon);
  const sharedRate = rates.silver === rates.silicon;
  const copy = locale === "zh-TW"
    ? sharedRate
      ? `電池粉直接出售，售價以其所含銀與矽基準價值的 ${silver} 計算。`
      : `電池粉直接出售，售價按銀基準價值的 ${silver} 與矽基準價值的 ${silicon} 計算。`
    : locale === "ja-JP"
    ? sharedRate
      ? `セル粉末は、含有する銀・シリコンの基準価値の${silver}で直接販売。`
      : `セル粉末は、銀の基準価値の${silver}とシリコンの基準価値の${silicon}で直接販売。`
    : sharedRate
      ? `Direct cell-powder sales realize ${silver} of the benchmark value of the silver and silicon they contain.`
      : `Direct cell-powder sales realize ${silver} of the silver benchmark value and ${silicon} of the silicon benchmark value.`;

  return <h3 className="os-economic-direct-sale">{copy}</h3>;
}
