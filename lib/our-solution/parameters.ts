export const solutionCodes = ['SHREDDING', 'HOT_KNIFE', 'PVCIRCULATOR'] as const;
export type SolutionCode = typeof solutionCodes[number];
export const labels = ['Shredding', 'Thermal processing', 'PV Circulator'] as const;
export const markets = ['World', 'Europe', 'United States', 'Japan', 'Taiwan', 'China', 'Australia'] as const;
export type Market = typeof markets[number];
import type { WebsiteData } from './public-data';
export type Parameters = {
  format: 'parameters-v2';
  scenario: { region_code: string; region: string; panels_per_month: number; panel_weight_lb: number; operating_hours_per_day: number; working_weeks_per_year: number; working_days_per_week: number };
  /** Section number → unique column-A label → value columns (units and sources retained). */
  assumptions: Record<string, Record<string, (number | string)[]>>;
  capacityHistory: Record<Market, Record<string, number>>;
  population: Record<Market, Record<string, number>> & { eu27: Record<string, Record<string, number>> };
  publicData: WebsiteData;
  meta: { currency: 'USD'; extractedAt: string; sourceSite: string; note: string };
};
export const parameter = (p: Parameters, section: number, label: string, index = 0): number => {
  const v = p.assumptions[section]?.[label]?.[index];
  if (typeof v !== 'number' || !Number.isFinite(v)) throw Error(`參數 ${section} · ${label} 必須是有限數字。`);
  return v;
};

export const eu27Countries=['AUT','BEL','BGR','HRV','CYP','CZE','DNK','EST','FIN','FRA','DEU','GRC','HUN','IRL','ITA','LVA','LTU','LUX','MLT','NLD','POL','PRT','ROU','SVK','SVN','ESP','SWE'] as const;
