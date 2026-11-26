import type { EconomicsView } from "../../lib/our-solution-data";

type BreakevenBasis = {
  source: string;
  panelsPerMonth: number;
  panelWeightKg: number;
  panelWeightLb?: number;
  weightUnit?: "kg" | "lb";
};

const wholeNumber = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 });
const weightNumber = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 2 });
const currencies = new Intl.DisplayNames("zh-TW", { type: "currency" });

export function chineseEconomicCopy(
  data: EconomicsView,
  region: string,
  breakeven: BreakevenBasis | null,
  breakevenRegion: string,
) {
  const scenario = data.scenario;
  const currency = currencies.of(scenario.currency);
  const unit = scenario.processingFeeUnit.endsWith("/lb") ? "磅" : "公斤";
  const fractionDigits = scenario.currency === "JPY" ? 0 : 2;
  const fee = new Intl.NumberFormat("zh-TW", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  const firstFee = Math.min(...data.feeSensitivity.feeSteps);
  const lastFee = Math.max(...data.feeSensitivity.feeSteps);

  let detail: string | undefined;
  if (breakeven) {
    const kilograms = `${weightNumber.format(breakeven.panelWeightKg)} 公斤`;
    const weight = breakeven.weightUnit === "lb" && breakeven.panelWeightLb !== undefined
      ? `${weightNumber.format(breakeven.panelWeightLb)} 磅（${kilograms}）`
      : kilograms;
    detail = `損益兩平加工費依${breakeven.source}計算：以${breakevenRegion}為例，每月處理 ${wholeNumber.format(breakeven.panelsPerMonth)} 片，每片約 ${weight}。不含資本支出與折舊，但含維護成本。`;
  }

  const { scenario1, scenario2Net } = data.cellPowder;
  const amount = (value: number) => `${wholeNumber.format(value)} ${currency}`;

  return {
    feeCopy: `以每${unit} ${fee.format(scenario.processingFee)} ${currency}計算，依模型處理量，每年可增加營收 ${wholeNumber.format(scenario.annualProcessingFeeRevenue)} ${currency}。圖中列出每${unit} ${fee.format(firstFee)}～${fee.format(lastFee)} ${currency}的敏感度分析。`,
    feeDetail: detail,
    feeSubtitle: `單位：千${currency}／年 · ${region} · 每月處理 ${wholeNumber.format(scenario.panelsPerMonth)} 片`,
    refiningCopy: `基準情境下，電池片粉末直接出售每年可得 ${amount(scenario1)}。依模型，走純化路線的淨值為 ${amount(scenario2Net)}，可增加 ${amount(scenario2Net - scenario1)}。`,
  };
}
