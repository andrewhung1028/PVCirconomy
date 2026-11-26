import type { MouPolicy } from "../mou-policy";
import type { OurSolutionParameterProfile } from './market';
import type { MarketTransport } from "./transport";

export const solutionCodes = ['SHREDDING', 'HOT_KNIFE', 'PVCIRCULATOR'] as const;
export type SolutionCode = typeof solutionCodes[number];
export const labels = ['Shredding', 'Thermal processing', 'PV Circulator'] as const;
export const markets = ['World', 'Europe', 'United States', 'Japan', 'Taiwan', 'China', 'Australia'] as const;
export type Market = typeof markets[number];
export type Parameters = {
  format: 'parameters-v2';
  scenario: { region_code: string; region: string; panels_per_month: number; panel_weight_lb?: number; panel_weight_kg?: number; operating_hours_per_day: number; working_weeks_per_year: number; working_days_per_week: number };
  /** Section number → unique column-A label → value columns (units and sources retained). */
  assumptions: Record<string, Record<string, (number | string)[]>>;
  transport?: MarketTransport;
  mouPolicy?: MouPolicy;
  capacityHistory: Record<Market, Record<string, number>>;
  population: Record<Market, Record<string, number>> & { eu27: Record<string, Record<string, number>> };
  meta: { currency: OurSolutionParameterProfile['currency']; locale?: OurSolutionParameterProfile['locale']; localPerUSD?: number; extractedAt: string; sourceSite: string; note: string };
};
export const parameter = (p: Parameters, section: number, label: string, index = 0): number => {
  const v = p.assumptions[section]?.[label]?.[index];
  if (typeof v !== 'number' || !Number.isFinite(v)) throw Error(`參數 ${section} · ${label} 必須是有限數字。`);
  return v;
};

export function scenarioRecyclingFeeSteps(p: Parameters) {
  const assumptions = p.assumptions[11];
  const steps = assumptions['Processing fee steps'] ?? assumptions['Processing fee steps (USD/lb)'];
  return [...new Set([...(steps ?? []).map(Number), parameter(p, 11, 'Recovery fee')])].sort((a, b) => a - b);
}

export const scenarioPanelWeightKg = (p: Parameters) =>
  p.scenario.panel_weight_kg ?? Number(p.scenario.panel_weight_lb) * parameter(p,3,'Kilograms per pound');
export const scenarioPanelWeightLb = (p: Parameters) =>
  p.scenario.panel_weight_lb ?? Number(p.scenario.panel_weight_kg) * parameter(p,3,'Pounds per kilogram');
export const parameterCurrency = (p: Parameters) => p.meta.currency ?? 'USD';
export const parameterLocale = (p: Parameters) => p.meta.locale ?? (parameterCurrency(p)==='JPY'?'ja-JP':'en-US');
export const localPerUSD = (p: Parameters) => p.meta.localPerUSD ?? 1;

export const eu27Countries=['AUT','BEL','BGR','HRV','CYP','CZE','DNK','EST','FIN','FRA','DEU','GRC','HUN','IRL','ITA','LVA','LTU','LUX','MLT','NLD','POL','PRT','ROU','SVK','SVN','ESP','SWE'] as const;
