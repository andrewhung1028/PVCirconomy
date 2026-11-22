// Cumulative installed solar capacity by market (GW), published through the
// Our Solution data workbook ("Market Capacity" sheet). Every year is stored;
// nothing is interpolated at runtime.
export const capacityMarkets = ["Europe", "United States", "Japan", "Taiwan", "Australia", "China", "Other markets", "World"] as const;
export type CapacityMarket = (typeof capacityMarkets)[number];
export const namedCapacityMarkets = capacityMarkets.slice(0, 6) as readonly CapacityMarket[];
export type MarketCapacityRow = { market: CapacityMarket; year: number; gw: number; source: string; sourceYear: number | null; note: string };

export const CHART_FIRST_YEAR = 2025;
export const CHART_LAST_YEAR = 2050;
export const US_FIRST_YEAR = 2000;
/** Tolerance for Other markets = World − six named markets, in GW. */
export const OTHER_MARKETS_TOLERANCE_GW = 0.01;

const isText = (value: unknown, max: number) => typeof value === "string" && value.length <= max && !value.includes("\0");

export function validateMarketCapacity(value: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(value) || !value.length) return ["Market Capacity 必須包含資料列。"];
  const seen = new Map<string, MarketCapacityRow>();
  for (const [index, raw] of value.entries()) {
    const row = raw as Partial<MarketCapacityRow> | null;
    const at = `Market Capacity 第 ${index + 2} 列`;
    if (!row || !capacityMarkets.includes(row.market as CapacityMarket)) { errors.push(`${at}：市場必須是 ${capacityMarkets.join("、")} 之一。`); continue; }
    if (!Number.isInteger(row.year) || row.year! < 1990 || row.year! > 2100) { errors.push(`${at}：年份必須是 1990–2100 的整數。`); continue; }
    if (typeof row.gw !== "number" || !Number.isFinite(row.gw)) errors.push(`${at}：累積裝置量必須是數字。`);
    else if (row.gw < 0) errors.push(`${at}：累積裝置量不可為負數。`);
    if (!isText(row.source, 200) || !String(row.source).trim()) errors.push(`${at}：出處不可空白（無出處請填「待補」）。`);
    if (row.sourceYear !== null && row.sourceYear !== undefined && (!Number.isInteger(row.sourceYear) || row.sourceYear < 1990 || row.sourceYear > 2100)) errors.push(`${at}：出處年份必須是年份或空白。`);
    if (!isText(row.note ?? "", 500)) errors.push(`${at}：備註過長。`);
    const key = `${row.market}|${row.year}`;
    if (seen.has(key)) errors.push(`Market Capacity：${row.market} ${row.year} 重複。`);
    else seen.set(key, row as MarketCapacityRow);
  }
  if (errors.length) return errors;
  const get = (market: CapacityMarket, year: number) => seen.get(`${market}|${year}`)?.gw;
  for (let year = CHART_FIRST_YEAR; year <= CHART_LAST_YEAR; year++) {
    const missing = capacityMarkets.filter((market) => get(market, year) === undefined);
    if (missing.length) { errors.push(`Market Capacity：${year} 缺少 ${missing.join("、")}。`); continue; }
    const expected = get("World", year)! - namedCapacityMarkets.reduce((sum, market) => sum + get(market, year)!, 0);
    if (Math.abs(get("Other markets", year)! - expected) > OTHER_MARKETS_TOLERANCE_GW) errors.push(`Market Capacity：${year} Other markets 應等於 World 減六個市場（${expected.toFixed(3)} GW），目前為 ${get("Other markets", year)!.toFixed(3)} GW。`);
  }
  let previous: number | undefined;
  for (let year = US_FIRST_YEAR; year <= CHART_LAST_YEAR; year++) {
    const gw = get("United States", year);
    if (gw === undefined) { errors.push(`Market Capacity：United States 需要 ${US_FIRST_YEAR}–${CHART_LAST_YEAR} 每一年（缺 ${year}）。`); break; }
    if (previous !== undefined && gw < previous) errors.push(`Market Capacity：United States ${year} 累積裝置量低於前一年。`);
    previous = gw;
  }
  return [...new Set(errors)];
}

export type CapacityTrendPoint = { year: string; total: number; totalLabel: string; values: number[] };

/** Slide data: one column per year 2025–2050; values follow the chart's market order (six markets, then Other markets); total is World. */
export function capacityTrend(rows: readonly MarketCapacityRow[]): CapacityTrendPoint[] {
  const byKey = new Map(rows.map((row) => [`${row.market}|${row.year}`, row.gw]));
  const points: CapacityTrendPoint[] = [];
  for (let year = CHART_FIRST_YEAR; year <= CHART_LAST_YEAR; year++) {
    const total = byKey.get(`World|${year}`)!;
    points.push({ year: String(year), total, totalLabel: `${(total / 1000).toFixed(1)} TW`, values: [...namedCapacityMarkets, "Other markets"].map((market) => byKey.get(`${market}|${year}`)!) });
  }
  return points;
}

/** US cumulative capacity in MW by year, US_FIRST_YEAR–CHART_LAST_YEAR. */
export function usCumulativeMw(rows: readonly MarketCapacityRow[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const row of rows) if (row.market === "United States" && row.year >= US_FIRST_YEAR && row.year <= CHART_LAST_YEAR) map.set(row.year, row.gw * 1000);
  return map;
}
