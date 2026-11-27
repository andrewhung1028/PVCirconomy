import type { EquipmentQuantitativeSettings } from "./equipment-quantitative";
import type { EquipmentModulePrices } from "./equipment-module-pricing";
import type { OurSolutionLocale } from "./our-solution/market";

export const equipmentVariants = ["economic", "basic", "premium", "plus"] as const;
export type EquipmentVariant = typeof equipmentVariants[number];
export type EquipmentBaseVariant = Exclude<EquipmentVariant, "plus">;

export const equipmentConfigurationLabels = { economic: "Economic", basic: "Basic", premium: "Premium", plus: "PLUS" } as const;

export const equipmentSpecificationGroups = [
  { title: "Performance", items: [
    ["Rated throughput", { economic: "1 panel/min", basic: "1 panel/min", premium: "1 panel/min", plus: "5 panel/min" }],
    ["Annual capacity", { economic: "115,200 panels/yr", basic: "115,200 panels/yr", premium: "115,200 panels/yr", plus: "576,000 panels/yr" }],
    ["Annual capacity (weight)", { economic: "2,304 t/yr", basic: "2,304 t/yr", premium: "2,304 t/yr", plus: "11,520 t/yr" }],
    ["Material recovery rate", { economic: ">90 wt.%", basic: "≥99.3 wt.%", premium: "≥99.3 wt.%", plus: ">90 wt.%" }],
    ["Equipment availability", { economic: ">90%", basic: ">90%", premium: ">90%", plus: ">90%" }],
    ["Energy consumption", { economic: "<1 kWh/panel", basic: "<1 kWh/panel", premium: "<1 kWh/panel", plus: "<1 kWh/panel" }],
    ["Direct operating personnel", { economic: "1 person/shift", basic: "1 person/shift", premium: "1 person/shift", plus: "1 person/shift" }],
    ["Indirect operating personnel", { economic: "2 persons/shift", basic: "2 persons/shift", premium: "2 persons/shift", plus: "2 persons/shift" }],
    ["Consumables cost", { economic: "0.05 USD/panel", basic: "0.1 USD/panel", premium: "0.1 USD/panel", plus: "0.15 USD/panel" }],
  ] },
  { title: "Dimensions & Weight", items: [
    ["Equipment length", { economic: "14,175 mm", basic: "17,340 mm", premium: "20,100 mm", plus: "5,147 mm" }],
    ["Equipment width", { economic: "1,883 mm", basic: "1,883 mm", premium: "1,883 mm", plus: "1,883 mm" }],
    ["Equipment height", { economic: "2,120 mm", basic: "2,120 mm", premium: "2,120 mm", plus: "2,120 mm" }],
    ["Equipment weight", { economic: "6,480 kg", basic: "9,180 kg", premium: "11,940 kg", plus: "6,120 kg" }],
    ["Recommended footprint", { economic: "17,175 × 4,883 mm", basic: "20,340 × 4,883 mm", premium: "23,100 × 4,883 mm", plus: "8,147 × 4,883 mm" }],
    ["Floor load", { economic: "242.8 kg/m²", basic: "281.2 kg/m²", premium: "315.5 kg/m²", plus: "631.5 kg/m²" }],
  ] },
  { title: "Module Compatibility", items: [
    ["Module length", { economic: "1,525–2,500 mm", basic: "1,525–2,500 mm", premium: "1,525–2,500 mm", plus: "—" }],
    ["Module width", { economic: "915–1,150 mm", basic: "915–1,150 mm", premium: "915–1,150 mm", plus: "—" }],
    ["Module max. weight", { economic: "50 kg", basic: "50 kg", premium: "50 kg", plus: "—" }],
    ["Module technology", { economic: "Crystalline-silicon PV", basic: "Crystalline-silicon PV", premium: "Crystalline-silicon PV", plus: "Crystalline-silicon PV" }],
    ["Module structure", { economic: "Glass-backsheet", basic: "Glass-backsheet", premium: "Glass-backsheet", plus: "Glass-glass / bifacial" }],
    ["Broken modules", { economic: "Not included", basic: "Not included", premium: "Not included", plus: "Included" }],
  ] },
  { title: "Utilities & Installation", items: [
    ["Process water", { economic: "Not required", basic: "Not required", premium: "Not required", plus: "Not required" }],
    ["Thermal treatment", { economic: "Not required", basic: "Not required", premium: "Not required", plus: "Not required" }],
    ["Chemicals", { economic: "Not required", basic: "Not required", premium: "Not required", plus: "Not required" }],
    ["Installation time", { economic: "1 day", basic: "1 day", premium: "1 day", plus: "1 day" }],
  ] },
  { title: "Processing & Safety", items: [
    ["Control", { economic: "PLC / IPC", basic: "PLC / IPC", premium: "PLC / IPC", plus: "PLC / IPC" }],
    ["Traceability", { economic: "Optional", basic: "Optional", premium: "Included", plus: "Optional" }],
    ["Remote support", { economic: "Included", basic: "Included", premium: "Included", plus: "—" }],
    ["Certification", { economic: "CE / UL 508A", basic: "CE / UL 508A", premium: "CE / UL 508A", plus: "CE / UL 508A" }],
    ["Noise level", { economic: "<80 dB @ 1 m", basic: "<85 dB @ 1 m", premium: "<85 dB @ 1 m", plus: "<80 dB @ 1 m" }],
    ["Warranty", { economic: "12 months", basic: "12 months", premium: "12 months", plus: "12 months" }],
  ] },
] as const;

type SpecificationLabel = typeof equipmentSpecificationGroups[number]["items"][number][0];

export const equipmentElectricalFields = [
  { key: "lineVoltage", label: "三相線電壓（V AC）", min: 1, max: 100_000 },
  { key: "powerFactor", label: "功率因數", min: 0.01, max: 1 },
  { key: "ratedCurrent", label: "額定最大電流（A）", min: 0, max: 100_000 },
  { key: "operatingCurrent", label: "平均運行電流（A）", min: 0, max: 100_000 },
  { key: "standbyCurrent", label: "生產待機電流（A）", min: 0, max: 100_000 },
  { key: "operatingCadence", label: "平均運行測試節拍（片／分鐘）", min: 0.01, max: 100_000 },
  { key: "referenceRatedKw", label: "既有額定功率（kW，未採電流試算時）", min: 0, max: 100_000 },
  { key: "referenceOperatingKw", label: "既有平均運行功率（kW，未採電流試算時）", min: 0, max: 100_000 },
] as const;

export type EquipmentElectrical = Record<typeof equipmentElectricalFields[number]["key"], number | null>;
export type EquipmentConfiguration = { values: Record<SpecificationLabel, string>; electrical: EquipmentElectrical };
export type EquipmentConfigurations = Record<EquipmentVariant, EquipmentConfiguration>;
export type EquipmentSettings = {
  revision: number;
  configurations: EquipmentConfigurations;
  modulePrices: EquipmentModulePrices;
  quantitative: EquipmentQuantitativeSettings;
  savedAt: string | null;
};

function measuredElectrical(ratedCurrent: number, operatingCurrent: number, standbyCurrent: number): EquipmentElectrical {
  return {
    lineVoltage: 380, powerFactor: 0.7, ratedCurrent, operatingCurrent, standbyCurrent,
    operatingCadence: 1, referenceRatedKw: null, referenceOperatingKw: null,
  };
}

const initialElectrical: Record<EquipmentVariant, EquipmentElectrical> = {
  economic: measuredElectrical(120, 55, 1.5),
  basic: measuredElectrical(135, 60, 1.8),
  premium: measuredElectrical(225, 100, 2),
  // Published PLUS reference ratings from the equipment FAQ. No current measurements were supplied.
  plus: {
    lineVoltage: null, powerFactor: null, ratedCurrent: null, operatingCurrent: null, standbyCurrent: null,
    operatingCadence: null, referenceRatedKw: 35, referenceOperatingKw: 28,
  },
};

export const defaultEquipmentConfigurations = Object.fromEntries(equipmentVariants.map(variant => [
  variant,
  {
    values: Object.fromEntries(equipmentSpecificationGroups.flatMap(group =>
      group.items.map(([label, values]) => [label, values[variant]]))),
    electrical: initialElectrical[variant],
  },
])) as EquipmentConfigurations;

export function equipmentElectricalRows(electrical: EquipmentElectrical, locale: OurSolutionLocale) {
  const { lineVoltage, powerFactor, operatingCadence, referenceRatedKw, referenceOperatingKw } = electrical;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  function power(current: number | null, reference: number | null = null) {
    if (current === null) return reference === null ? "—" : `${number.format(reference)} kW`;
    if (lineVoltage === null || powerFactor === null) return `${number.format(current)} A`;
    const kw = Math.sqrt(3) * lineVoltage * current * powerFactor / 1000;
    return `${number.format(kw)} kW · ${number.format(current)} A`;
  }
  return [
    ["Rated maximum power (installed)", power(electrical.ratedCurrent, referenceRatedKw)],
    ["Average operating power", power(electrical.operatingCurrent, referenceOperatingKw)],
    ["Production standby power", power(electrical.standbyCurrent)],
    ["Reference line voltage (three-phase)", lineVoltage === null ? "—" : `${number.format(lineVoltage)} V AC`],
    ["Power factor", powerFactor === null ? "—" : number.format(powerFactor)],
    ["Operating power test throughput", operatingCadence === null ? "—"
      : `${number.format(operatingCadence)} ${locale === "zh-TW" ? "片／分鐘" : locale === "ja-JP" ? "枚／分" : "panels/min"}`],
  ] as const;
}

export function equipmentLineRating(configurations: EquipmentConfigurations, variant: EquipmentVariant = "basic") {
  const values = configurations[variant].values;
  const fallback = defaultEquipmentConfigurations[variant].values;
  const number = (key: SpecificationLabel, pattern: RegExp) => Number(
    pattern.exec(values[key])?.[1] ?? pattern.exec(fallback[key])?.[1],
  );
  return {
    panelsPerMinute: number("Rated throughput", /^(\d+(?:\.\d+)?)\s*(?:panels?\s*\/\s*min)?$/i),
    direct: number("Direct operating personnel", /^(\d+)\s*(?:persons?\s*\/\s*shift)?$/i),
    support: number("Indirect operating personnel", /^(\d+)\s*(?:persons?\s*\/\s*shift)?$/i),
  };
}

export function integratedEquipmentThroughput(configurations: EquipmentConfigurations, base: EquipmentBaseVariant = "basic") {
  return Math.min(equipmentLineRating(configurations, base).panelsPerMinute, equipmentLineRating(configurations, "plus").panelsPerMinute);
}

export function equipmentFootprint(configuration: EquipmentConfiguration) {
  const dimension = (key: "Equipment length" | "Equipment width") => {
    const match = /^([\d,.]+)\s*mm$/i.exec(configuration.values[key].trim());
    return match ? Number(match[1].replaceAll(",", "")) / 1000 : NaN;
  };
  const length = dimension("Equipment length"), width = dimension("Equipment width");
  if (!(length > 0 && width > 0)) return null;
  const operatingLength = length + 2 * 1.5, operatingWidth = width + 2 * 1.5;
  return { equipmentArea: length * width, operatingLength, operatingWidth, operatingArea: operatingLength * operatingWidth };
}

export function operatingFootprintLabel(configuration: EquipmentConfiguration, locale: OurSolutionLocale) {
  const footprint = equipmentFootprint(configuration);
  if (!footprint) return "—";
  const size = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
  const area = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return `${size.format(footprint.operatingLength)} × ${size.format(footprint.operatingWidth)} m (${area.format(footprint.operatingArea)} m²)`;
}
