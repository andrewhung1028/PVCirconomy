import { standardRecoveryRates } from "../circulator-recovery";
import type { MasterData } from "./types";

// Keep imported workbooks intact; the public calculator uses the calibrated line profile.
export function calibratedBusinessCaseData(data: MasterData): MasterData {
  const rules = data.recovery.filter(r => r.active && r.solutionCode === "PVCIRCULATOR");
  const materials = data.materials.filter(m => m.active);
  const materialRates = materials.map(m => ({
    name: m.code, share: m.composition, rate: rules.find(r => r.materialCode === m.code)?.recoveryRate,
  }));
  if (materialRates.some(m => m.rate == null)) return data;
  const rates = standardRecoveryRates(materialRates.map(m => ({ ...m, rate: m.rate! })));
  return { ...data, recovery: data.recovery.map(r =>
    r.active && r.solutionCode === "PVCIRCULATOR" && rates.has(r.materialCode)
      ? { ...r, recoveryRate: rates.get(r.materialCode)! } : r) };
}
