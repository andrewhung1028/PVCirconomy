import type { Parameters } from "./parameters";
import schema from "../../data/our-solution-parameter-schema.json";

export const sharedAssumptionKeys = {
  "3": ["Short tons per metric ton", "Pounds per metric ton", "Pounds per kilogram", "Square feet per square metre", "Kilograms per pound"],
  "9": ["Grams per troy ounce", "Molar mass Ag", "Molar mass Cu", "Molar mass Al", "Molar mass H2SO4", "Molar mass H2O2", "Molar mass HNO3", "Faraday constant"],
} as const;

// Market-specific prices, material benchmarks and retirement profiles stay in the market workbooks.
const localRows: Record<string, readonly string[]> = {
  "4": ["Consumables", "Capex per line"],
  "9": ["Nitric acid price", "Sulfuric acid price", "Hydrogen peroxide price", ...sharedAssumptionKeys["9"]],
  "10": ["Loss scenario"],
};
const baseAssumptions: Parameters["assumptions"] = schema;
export const commonAssumptionSchema: Parameters["assumptions"] = Object.fromEntries(
  ["3", "4", "5", "6", "7", "8", "9", "10"].map(section => [
    section,
    Object.fromEntries(Object.entries(baseAssumptions[section])
      .filter(([key]) => !(localRows[section] ?? (section === "3" ? sharedAssumptionKeys["3"] : [])).includes(key))
      .map(([key, values]) => [key, section === "5" ? values.slice(0, 1) : values])),
  ]),
);

export function commonAssumptionsFrom(data: Pick<Parameters, "assumptions">): Parameters["assumptions"] {
  return Object.fromEntries(Object.entries(commonAssumptionSchema).map(([section, rows]) => [
    section,
    Object.fromEntries(Object.entries(rows).map(([key, values]) => [key, data.assumptions[section][key].slice(0, values.length)])),
  ]));
}

export function sharedAssumptionValues(shared: SharedParameters | undefined, section: string, key: string) {
  return shared?.assumptions[section]?.[key] ?? shared?.commonAssumptions?.[section]?.[key];
}

export type SharedParameters = Pick<Parameters, "capacityHistory" | "population" | "assumptions"> & {
  commonAssumptions?: Parameters["assumptions"];
};
type MarketParameters = Omit<Parameters, "capacityHistory" | "population">;

export function sharedParameters(data: Parameters): SharedParameters {
  return {
    capacityHistory: data.capacityHistory,
    population: data.population,
    assumptions: Object.fromEntries(Object.entries(sharedAssumptionKeys).map(([section, keys]) =>
      [section, Object.fromEntries(keys.map(key => [key, data.assumptions[section][key]]))])),
  };
}

export function marketParameters({ capacityHistory, population, ...data }: Parameters): MarketParameters {
  const assumptions = { ...data.assumptions };
  for (const [section, keys] of Object.entries(sharedAssumptionKeys)) {
    assumptions[section] = { ...assumptions[section] };
    for (const key of keys) delete assumptions[section][key];
  }
  return { ...data, assumptions };
}

export function withSharedParameters(data: MarketParameters, shared: SharedParameters): Parameters {
  const assumptions = { ...data.assumptions };
  for (const [section, keys] of Object.entries(sharedAssumptionKeys)) {
    assumptions[section] = {
      ...assumptions[section],
      ...Object.fromEntries(keys.map(key => [key, shared.assumptions[section][key]])),
    };
  }
  for (const [section, rows] of Object.entries(shared.commonAssumptions ?? {})) {
    assumptions[section] = { ...assumptions[section] };
    for (const [key, values] of Object.entries(rows)) {
      assumptions[section][key] = [...values, ...(assumptions[section][key]?.slice(values.length) ?? [])];
    }
  }
  return { ...data, capacityHistory: shared.capacityHistory, population: shared.population, assumptions };
}
