import { equipmentVariants, type EquipmentVariant } from "./equipment-configurations";

export const equipmentPriceModules = [
  ["system", "系統"], ["infeed", "進料"], ["measurement", "量測"], ["junctionBox", "拆盒"],
  ["frame", "拆框"], ["milling1", "銑一"], ["milling2", "銑二"], ["outfeed", "出料"], ["plusModule", "PLUS 模組"],
] as const;
export type EquipmentPriceModule = typeof equipmentPriceModules[number][0];
export type EquipmentModulePrices = Record<EquipmentPriceModule, Record<EquipmentVariant, number | null>>;

export function validModuleAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 10_000
    && Number(value.toFixed(6)) === value;
}

export function equipmentUsdTotal(prices: EquipmentModulePrices, variant: EquipmentVariant) {
  return equipmentPriceModules.reduce((cents, [key]) => cents + Math.round((prices[key][variant] ?? 0) * 1_000_000), 0) / 100;
}

export function equipmentMarketAmount(usd: number, currency: string, rate: number | undefined, factor: number) {
  if (currency === "USD") return usd;
  if (rate === undefined) return null;
  return Number((usd * rate * factor).toFixed(currency === "JPY" ? 0 : 2));
}

export function validateEquipmentModulePrices(value: unknown): EquipmentModulePrices | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const root = value as Record<string, unknown>;
  const result = {} as EquipmentModulePrices;
  for (const [key] of equipmentPriceModules) {
    const row = root[key];
    if (!row || typeof row !== "object" || Array.isArray(row)) return null;
    const prices = {} as EquipmentModulePrices[typeof key];
    for (const variant of equipmentVariants) {
      const amount = (row as Record<string, unknown>)[variant];
      if (amount !== null && !validModuleAmount(amount)) return null;
      prices[variant] = amount;
    }
    result[key] = prices;
  }
  return result;
}
