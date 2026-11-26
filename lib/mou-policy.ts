export type MouPolicy = { validityDays: number; confidentialityYears: number };
export const defaultMouPolicy: MouPolicy = { validityDays: 180, confidentialityYears: 3 };

export function validMouPolicy(value: unknown): value is MouPolicy {
  const policy = value as Partial<MouPolicy> | null;
  return !!policy && typeof policy.validityDays === "number" && Number.isInteger(policy.validityDays)
    && policy.validityDays >= 1 && policy.validityDays <= 3650
    && typeof policy.confidentialityYears === "number" && Number.isInteger(policy.confidentialityYears)
    && policy.confidentialityYears >= 0 && policy.confidentialityYears <= 100;
}
