import { publicSolutionMarkets, type PublicSolutionMarket } from "./our-solution/market";

type Field = readonly [key: string, label: string, initial: number, min: number, max: number, step?: number];

export const equipmentClaimFields = [
  ["annualPanels", "行銷情境產能上限（片／年）", 240_000, 1, 10_000_000, 1],
  ["recoveryPercent", "行銷重量回收率下限（%）", 99, 0, 100],
  ["glassPurityPercent", "玻璃純度下限（%）", 99, 0, 100],
  ["glassInCellPowderPercent", "細胞粉玻璃含量上限（%）", 1, 0, 100],
  ["infeedPanelsPerPallet", "自動進料參考片數（片／棧板）", 30, 1, 1000, 1],
  ["relocationHours", "搬遷作業參考時間（小時，不含運輸）", 24, 1, 720, 1],
] as const satisfies readonly Field[];

const weeksPerYear = 52;
const monthsPerYear = 12;
const calendarHours = 365 * 24;
export const capacityCalendar = { weeksPerYear, monthsPerYear, calendarHours };

export const capacityDefaultFields = [
  ["days", "每年工作日", 260, 1, 365, 1],
  ["shifts", "每日班次", 1, 1, 24, 1],
  ["hours", "每班小時", 8, 0.25, 24, 0.25],
  ["maintenance", "班外維護（小時／月）", 8, 0, calendarHours / monthsPerYear],
  ["inShiftMaintenance", "班內維護（小時／週）", 4, 0, 168],
  ["uptime", "稼動率（%）", 85, 0, 100],
  ["speed", "額定速度比例（%）", 85, 0, 100],
] as const satisfies readonly Field[];

export const inquiryDefaultFields = [
  ["lineQuantity", "詢價預填產線數量", 1, 1, 10_000, 1],
  ["floorAreaFt2", "詢價預填樓地板面積（ft²）", 10_000, 0, 1_000_000],
  ["floorAreaM2", "詢價預填樓地板面積（m²）", 1000, 0, 1_000_000],
] as const satisfies readonly Field[];

export const equipmentMarketFields = [...capacityDefaultFields, ...inquiryDefaultFields] as const;
export const equipmentPricingFields = [
  ["nonUsdFactor", "非美元設備價格換算乘數", 1.05, 0.01, 10],
] as const satisfies readonly Field[];

export const equipmentMouFields = [
  ["standardCells", "參考模組電池片數", 60, 1, 1000, 1],
  ["compressedAirLpm", "空壓流量（L／min）", 400, 0, 100_000],
  ["compressedAirBar", "空壓壓力（bar）", 8, 0, 1000],
  ["frameMinMm", "含框最小厚度（mm）", 25, 0, 500],
  ["frameMaxMm", "含框最大厚度（mm）", 50, 0, 500],
  ["glassMinMm", "玻璃最小厚度（mm）", 3, 0, 500],
  ["glassMaxMm", "玻璃最大厚度（mm）", 5, 0, 500],
  ["economicInstalledKw", "Economic 安裝功率（kW）", 65, 0, 100_000],
  ["basicInstalledKw", "Basic 安裝功率（kW）", 85, 0, 100_000],
  ["premiumInstalledKw", "Premium 安裝功率（kW）", 100, 0, 100_000],
] as const satisfies readonly Field[];

// Nominal line-to-line voltages: https://www.worldstandards.eu/electricity/three-phase-electric-power/
export const defaultSitePowerOptions = {
  US: ["208 V · 60 Hz", "240 V · 60 Hz", "480 V · 60 Hz"],
  CA: ["208 V · 60 Hz", "240 V · 60 Hz", "480 V · 60 Hz", "600 V · 60 Hz"],
  AU: ["400 V · 50 Hz", "415 V · 50 Hz"],
  UK: ["400 V · 50 Hz"],
  EU: ["400 V · 50 Hz"],
  JP: ["200 V · 50 Hz", "200 V · 60 Hz"],
} satisfies Record<PublicSolutionMarket, readonly string[]>;

export type SitePowerOptions = Record<PublicSolutionMarket, readonly string[]>;

export function isSitePowerOption(value: unknown): value is string {
  return typeof value === "string" && /^[1-9]\d{0,4} V · [1-9]\d{0,2} Hz$/.test(value);
}

type Numbers<T extends readonly Field[]> = Record<T[number][0], number>;
export type EquipmentClaims = Numbers<typeof equipmentClaimFields>;
export type EquipmentMouDefaults = Numbers<typeof equipmentMouFields>;
export type CapacityDefaults = Numbers<typeof capacityDefaultFields>;
export type EquipmentMarketDefaults = Numbers<typeof equipmentMarketFields>;

export type EquipmentQuantitativeSettings = {
  claims: EquipmentClaims;
  markets: Record<PublicSolutionMarket, EquipmentMarketDefaults>;
  mou: EquipmentMouDefaults;
  sitePower: SitePowerOptions;
  pricing: Numbers<typeof equipmentPricingFields>;
};

function defaults<T extends readonly Field[]>(fields: T): Numbers<T> {
  return Object.fromEntries(fields.map(([key, , initial]) => [key, initial])) as Numbers<T>;
}

export const defaultEquipmentQuantitative: EquipmentQuantitativeSettings = {
  claims: defaults(equipmentClaimFields),
  markets: Object.fromEntries(publicSolutionMarkets.map(market => [market, defaults(equipmentMarketFields)])) as EquipmentQuantitativeSettings["markets"],
  mou: defaults(equipmentMouFields),
  sitePower: defaultSitePowerOptions,
  pricing: defaults(equipmentPricingFields),
};

export function equipmentSchedule(defaults: CapacityDefaults) {
  const { days, shifts, hours, maintenance, inShiftMaintenance } = defaults;
  const dailyHours = shifts * hours;
  const scheduledHours = days * dailyHours;
  const annualPlannedMaintenance = maintenance * monthsPerYear;
  const annualInShiftMaintenance = inShiftMaintenance * weeksPerYear;
  const calendarMaintenanceHours = annualPlannedMaintenance + annualInShiftMaintenance;
  const scheduledMaintenanceHours = annualInShiftMaintenance + (shifts === 3 ? annualPlannedMaintenance : 0);
  const valid = dailyHours <= 24 && scheduledMaintenanceHours <= scheduledHours && calendarMaintenanceHours <= calendarHours;
  return { dailyHours, scheduledHours, calendarMaintenanceHours, scheduledMaintenanceHours, valid };
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function equipmentFieldValue(field: Field, value: unknown): value is number {
  const [, , , min, max, step] = field;
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
    && (step === undefined || Number.isInteger(value / step));
}

function read<T extends readonly Field[]>(fields: T, value: unknown): Numbers<T> | null {
  const input = record(value);
  const entries: [string, number][] = [];
  for (const field of fields) {
    const candidate = input[field[0]];
    if (!equipmentFieldValue(field, candidate)) return null;
    entries.push([field[0], candidate]);
  }
  return Object.fromEntries(entries) as Numbers<T>;
}

export function validateEquipmentQuantitative(value: unknown): EquipmentQuantitativeSettings | null {
  const input = record(value);
  const claims = read(equipmentClaimFields, input.claims);
  const pricing = read(equipmentPricingFields, input.pricing);
  const mou = read(equipmentMouFields, input.mou);
  if (!claims || !pricing || !mou || mou.frameMinMm > mou.frameMaxMm || mou.glassMinMm > mou.glassMaxMm) return null;
  const marketInput = record(input.markets);
  const markets = {} as EquipmentQuantitativeSettings["markets"];
  const sitePower = {} as SitePowerOptions;
  const powerInput = record(input.sitePower);
  for (const market of publicSolutionMarkets) {
    const defaults = read(equipmentMarketFields, marketInput[market]);
    if (!defaults || !equipmentSchedule(defaults).valid) return null;
    const options = powerInput[market];
    if (!Array.isArray(options) || options.length < 1 || options.length > 12
      || !options.every(isSitePowerOption) || new Set(options).size !== options.length) return null;
    markets[market] = defaults;
    sitePower[market] = [...options];
  }
  return { claims, pricing, markets, mou, sitePower };
}
