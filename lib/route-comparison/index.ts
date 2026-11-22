import "server-only";
import { calculateBusinessCase } from "../business-case/calculator/engine";
import type { MasterData } from "../business-case/types";
import { REFERENCE_CASE, GRID_KG_CO2E_PER_KWH, SHOW_COMPETITOR_PROFIT } from "./config";

export function routeComparison(data: MasterData) {
  const r = REFERENCE_CASE;
  if (!data.regions.some(region => region.code === r.regionCode && region.active)) {
    console.warn("Route comparison unavailable: US-CA is inactive in the published master data.");
    return [];
  }
  const codes = ["CONVENTIONAL", "HOT_KNIFE", "PVCIRCULATOR"].filter(code => data.solutions.some(s => s.code === code && s.active));
  if (!codes.length) return [];
  const out = calculateBusinessCase(data, { regionCode: r.regionCode, panelsPerMonth: r.panelsPerMonth, processingFee: r.processingFee, solutionCodes: codes, panelWeightLb: r.panelWeightLb });
  const mw = r.panelsPerMonth * 12 * r.panelWatts / 1e6;
  const panelsPerMw = 1e6 / r.panelWatts;
  return out.solutions.map(s => {
    const sol = data.solutions.find(x => x.code === s.code)!;
    return {
      code: s.code,
      materialRevenuePerMw: s.materialRevenue / mw,
      feePerMw: s.processingRevenue / mw,
      ebitdaPerMw: s.annualEbitda / mw,
      landfillTPerMw: s.residualMetricTons / mw,
      co2eTPerMw: sol.kwhPerPanel * panelsPerMw * GRID_KG_CO2E_PER_KWH / 1000,
      recoveryRate: s.recoveryRate,
    };
  });
}
export type RouteComparison = ReturnType<typeof routeComparison>[number];
export type PublicRoute = Omit<RouteComparison, "materialRevenuePerMw" | "ebitdaPerMw" | "feePerMw"> & Partial<Pick<RouteComparison, "materialRevenuePerMw" | "ebitdaPerMw" | "feePerMw">>;
// Strip hidden financials before crossing the server/client boundary, including RSC payloads.
export function publicRoutes(routes: RouteComparison[]): PublicRoute[] {
  return routes.map(({ materialRevenuePerMw, ebitdaPerMw, feePerMw, ...environment }) =>
    SHOW_COMPETITOR_PROFIT || environment.code === "PVCIRCULATOR"
      ? { ...environment, materialRevenuePerMw, ebitdaPerMw, feePerMw }
      : environment);
}
export const routeEnvironmentalMetrics = (data: MasterData) => routeComparison(data).map(({ code, landfillTPerMw, co2eTPerMw }) => ({ code, landfillTPerMw, co2eTPerMw }));
export type RouteEnvironmentalMetric = ReturnType<typeof routeEnvironmentalMetrics>[number];
