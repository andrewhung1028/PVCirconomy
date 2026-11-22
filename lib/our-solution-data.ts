import seedData from "../data/our-solution-economics-usd.json";
import seedMarketCapacity from "../data/our-solution-market-capacity.json";
import { validateMarketCapacity, type MarketCapacityRow } from "./market-capacity";

export const solutionCodes = ["CONVENTIONAL", "HOT_KNIFE", "PVCIRCULATOR"] as const;
export type SolutionCode = (typeof solutionCodes)[number];

export type OurSolutionEconomics = {
  meta: {
    currency: "USD";
    sourceSite: string;
    calculatorDataApi: string;
    calculationApi: string;
    sourceSystem: string;
    extractedAt: string;
    fxEffectiveDate: string;
    note: string;
  };
  scenario: {
    regionCode: string;
    region: string;
    country: string;
    panelsPerMonth: number;
    annualPanels: number;
    panelWeightLb: number;
    annualInputMetricTons: number;
    processingFeeUsdPerLb: number;
    operatingDaysPerMonth: number;
    operatingHoursPerDay: number;
  };
  solutions: Array<{
    code: SolutionCode;
    label: string;
    annualMaterialRevenue: number;
    annualOpex: number;
    annualEbitda: number;
    capexUsd: number;
    recoveryRate: number;
    residualMetricTons: number;
    materialRevenue: { silver: number; aluminumAndCopper: number; other: number };
    opexPerPanel: { electricity: number; laborAndBurden: number; facility: number; other: number; total: number };
  }>;
  feeSensitivity: {
    feeUsdPerLb: number[];
    annualEbitdaUsdThousands: Record<SolutionCode, number[]>;
  };
  silverSensitivity: {
    changePercent: number[];
    annualEbitdaUsdThousands: Record<SolutionCode, number[]>;
  };
  /** Market Capacity sheet. Optional so versions published before it existed stay valid; they use the seeded rows. */
  marketCapacity?: MarketCapacityRow[];
};

export const seededMarketCapacity = seedMarketCapacity as MarketCapacityRow[];
export const seededOurSolutionData = { ...(seedData as OurSolutionEconomics), marketCapacity: seededMarketCapacity };

/** Market capacity rows for a published version; versions without the sheet fall back to the seeded rows (identical to the pre-sheet chart). */
export function marketCapacityOf(data: OurSolutionEconomics): MarketCapacityRow[] {
  return data.marketCapacity?.length ? data.marketCapacity : seededMarketCapacity;
}

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const cleanText = (value: unknown, max = 240): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= max && !value.includes("\0");
const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.01, Math.abs(b) * 0.000001);

export function validateOurSolutionData(value: unknown): { valid: true; data: OurSolutionEconomics } | { valid: false; errors: string[] } {
  const data = value as Partial<OurSolutionEconomics> | null;
  const errors: string[] = [];
  if (!data || typeof data !== "object") return { valid: false, errors: ["資料格式無效。"] };
  if (data.meta?.currency !== "USD") errors.push("幣別必須為 USD。");
  if (!cleanText(data.meta?.sourceSite) || !cleanText(data.meta?.note, 500)) errors.push("來源或揭露說明缺失。");
  const scenario = data.scenario;
  if (!scenario || !cleanText(scenario.regionCode, 40) || !cleanText(scenario.region, 100)) errors.push("情境地區資料缺失。");
  const scenarioNumbers = scenario ? [scenario.panelsPerMonth, scenario.annualPanels, scenario.panelWeightLb, scenario.annualInputMetricTons, scenario.processingFeeUsdPerLb, scenario.operatingDaysPerMonth, scenario.operatingHoursPerDay] : [];
  if (scenarioNumbers.length !== 7 || scenarioNumbers.some((item) => !finite(item) || item < 0)) errors.push("情境數值必須是非負有限數字。");
  if (!Array.isArray(data.solutions) || data.solutions.length !== solutionCodes.length) errors.push("必須包含三種指定處理方案。");
  const byCode = new Map((data.solutions ?? []).map((item) => [item?.code, item]));
  for (const code of solutionCodes) {
    const item = byCode.get(code);
    if (!item || !cleanText(item.label, 80)) { errors.push(`${code} 方案缺失。`); continue; }
    const values = [item.annualMaterialRevenue, item.annualOpex, item.annualEbitda, item.capexUsd, item.recoveryRate, item.residualMetricTons, item.materialRevenue?.silver, item.materialRevenue?.aluminumAndCopper, item.materialRevenue?.other, item.opexPerPanel?.electricity, item.opexPerPanel?.laborAndBurden, item.opexPerPanel?.facility, item.opexPerPanel?.other, item.opexPerPanel?.total];
    if (values.some((entry) => !finite(entry))) errors.push(`${code} 含有空白或非數字欄位。`);
    if (finite(item.recoveryRate) && (item.recoveryRate < 0 || item.recoveryRate > 1)) errors.push(`${code} 回收率必須介於 0% 與 100%。`);
    if (finite(item.annualMaterialRevenue) && finite(item.materialRevenue?.silver) && finite(item.materialRevenue?.aluminumAndCopper) && finite(item.materialRevenue?.other) && !close(item.annualMaterialRevenue, item.materialRevenue.silver + item.materialRevenue.aluminumAndCopper + item.materialRevenue.other)) errors.push(`${code} 材料收益明細與總額不一致。`);
    if (finite(item.annualEbitda) && finite(item.annualMaterialRevenue) && finite(item.annualOpex) && !close(item.annualEbitda, item.annualMaterialRevenue - item.annualOpex)) errors.push(`${code} EBITDA 必須等於材料收益減 OPEX。`);
    if (finite(item.opexPerPanel?.total) && finite(item.opexPerPanel?.electricity) && finite(item.opexPerPanel?.laborAndBurden) && finite(item.opexPerPanel?.facility) && finite(item.opexPerPanel?.other) && !close(item.opexPerPanel.total, item.opexPerPanel.electricity + item.opexPerPanel.laborAndBurden + item.opexPerPanel.facility + item.opexPerPanel.other)) errors.push(`${code} 每片 OPEX 明細與總額不一致。`);
  }
  const fee = data.feeSensitivity;
  const silver = data.silverSensitivity;
  if (!fee || fee.feeUsdPerLb?.length !== 7 || !fee.feeUsdPerLb.every(finite)) errors.push("處理費敏感度必須包含 7 個有效級距。");
  if (!silver || silver.changePercent?.length !== 5 || !silver.changePercent.every(finite)) errors.push("白銀敏感度必須包含 5 個有效級距。");
  for (const code of solutionCodes) {
    if (!fee?.annualEbitdaUsdThousands?.[code] || fee.annualEbitdaUsdThousands[code].length !== 7 || !fee.annualEbitdaUsdThousands[code].every(finite)) errors.push(`${code} 處理費敏感度資料不完整。`);
    if (!silver?.annualEbitdaUsdThousands?.[code] || silver.annualEbitdaUsdThousands[code].length !== 5 || !silver.annualEbitdaUsdThousands[code].every(finite)) errors.push(`${code} 白銀敏感度資料不完整。`);
  }
  if (data.marketCapacity !== undefined) errors.push(...validateMarketCapacity(data.marketCapacity));
  return errors.length ? { valid: false, errors: [...new Set(errors)] } : { valid: true, data: value as OurSolutionEconomics };
}

export type EconomicsDiff = { field: string; label: string; before: string; after: string };
const display = (value: unknown) => typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 4 }) : String(value ?? "");

export function diffOurSolutionData(before: OurSolutionEconomics, after: OurSolutionEconomics): EconomicsDiff[] {
  const rows: EconomicsDiff[] = [];
  const compare = (field: string, label: string, a: unknown, b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) rows.push({ field, label, before: display(a), after: display(b) }); };
  Object.entries(after.scenario).forEach(([key, value]) => compare(`scenario.${key}`, `Scenario · ${key}`, before.scenario[key as keyof typeof before.scenario], value));
  for (const code of solutionCodes) {
    const a = before.solutions.find((item) => item.code === code)!;
    const b = after.solutions.find((item) => item.code === code)!;
    (["annualMaterialRevenue", "annualOpex", "annualEbitda", "capexUsd", "recoveryRate", "residualMetricTons"] as const).forEach((key) => compare(`solutions.${code}.${key}`, `${b.label} · ${key}`, a[key], b[key]));
    Object.entries(b.materialRevenue).forEach(([key, value]) => compare(`solutions.${code}.materialRevenue.${key}`, `${b.label} · materialRevenue.${key}`, a.materialRevenue[key as keyof typeof a.materialRevenue], value));
    Object.entries(b.opexPerPanel).forEach(([key, value]) => compare(`solutions.${code}.opexPerPanel.${key}`, `${b.label} · opexPerPanel.${key}`, a.opexPerPanel[key as keyof typeof a.opexPerPanel], value));
  }
  for (const code of solutionCodes) {
    after.feeSensitivity.annualEbitdaUsdThousands[code].forEach((value, index) => compare(`feeSensitivity.${code}.${index}`, `Fee sensitivity · ${code} · ${after.feeSensitivity.feeUsdPerLb[index]}`, before.feeSensitivity.annualEbitdaUsdThousands[code][index], value));
    after.silverSensitivity.annualEbitdaUsdThousands[code].forEach((value, index) => compare(`silverSensitivity.${code}.${index}`, `Silver sensitivity · ${code} · ${after.silverSensitivity.changePercent[index]}%`, before.silverSensitivity.annualEbitdaUsdThousands[code][index], value));
  }
  const capacity = (data: OurSolutionEconomics) => new Map(marketCapacityOf(data).map((row) => [`${row.market} · ${row.year}`, row]));
  const capacityBefore = capacity(before), capacityAfter = capacity(after);
  for (const key of new Set([...capacityBefore.keys(), ...capacityAfter.keys()])) {
    const a = capacityBefore.get(key), b = capacityAfter.get(key);
    compare(`marketCapacity.${key}.gw`, `Market Capacity · ${key} · GW`, a?.gw ?? "", b?.gw ?? "");
    compare(`marketCapacity.${key}.source`, `Market Capacity · ${key} · 出處`, a ? `${a.source}${a.sourceYear ? ` (${a.sourceYear})` : ""}` : "", b ? `${b.source}${b.sourceYear ? ` (${b.sourceYear})` : ""}` : "");
    compare(`marketCapacity.${key}.note`, `Market Capacity · ${key} · 備註`, a?.note ?? "", b?.note ?? "");
  }
  return rows;
}
