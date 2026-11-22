import { calculateBusinessCase } from './calculator/engine';
import type { MasterData } from './types';

/** Processing fee at which annual EBITDA is zero, from the engine (EBITDA is linear in the fee). */
export function breakevenFees(data: MasterData, scenario: { regionCode: string; panelsPerMonth: number }, codes: string[]) {
  const run = (processingFee: number) => calculateBusinessCase(data, { regionCode: scenario.regionCode, panelsPerMonth: scenario.panelsPerMonth, processingFee, solutionCodes: codes });
  const zero = run(0), one = run(1);
  return {
    regionCode: zero.region.code,
    region: zero.region.region,
    feeUnit: zero.region.feeUnit,
    currency: zero.region.currency,
    panelsPerMonth: scenario.panelsPerMonth,
    panelWeightLb: zero.input.panelWeightLb,
    fees: zero.solutions.map((s: any) => {
      const e0 = s.annualEbitda, e1 = one.solutions.find((x: any) => x.code === s.code)!.annualEbitda;
      return { code: s.code, ebitdaAtZeroFee: e0, breakevenFee: e1 === e0 ? null : Math.max(0, -e0 / (e1 - e0)) };
    }),
  };
}
