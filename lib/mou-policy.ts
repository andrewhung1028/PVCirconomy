import type { PublicSolutionMarket } from "./our-solution/market";

export type MouPolicy = { validityDays: number; confidentialityYears: number; salesAgents?: string[] };
export const defaultMouPolicy: MouPolicy = { validityDays: 180, confidentialityYears: 3 };

export function defaultMouSalesAgents(market: PublicSolutionMarket): string[] {
  return market === "JP" ? ["住友商事", "川重商事株式会社"] : [];
}

export function validMouPolicy(value: unknown): value is MouPolicy {
  const policy = value as Partial<MouPolicy> | null;
  return !!policy && typeof policy.validityDays === "number" && Number.isInteger(policy.validityDays)
    && policy.validityDays >= 1 && policy.validityDays <= 3650
    && typeof policy.confidentialityYears === "number" && Number.isInteger(policy.confidentialityYears)
    && policy.confidentialityYears >= 0 && policy.confidentialityYears <= 100
    && (policy.salesAgents === undefined || (
      Array.isArray(policy.salesAgents) && policy.salesAgents.length <= 12
      && new Set(policy.salesAgents).size === policy.salesAgents.length
      && policy.salesAgents.every(agent => typeof agent === "string" && agent.length > 0 && agent.length <= 160
        && agent === agent.trim() && !/[\x00-\x1f]/.test(agent))
    ));
}
