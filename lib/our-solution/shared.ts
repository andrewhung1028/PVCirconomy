import type { Parameters } from "./parameters";

export const sharedAssumptionKeys = {
  "3": ["Short tons per metric ton", "Pounds per metric ton", "Pounds per kilogram", "Square feet per square metre", "Kilograms per pound"],
  "9": ["Grams per troy ounce", "Molar mass Ag", "Molar mass Cu", "Molar mass Al", "Molar mass H2SO4", "Molar mass H2O2", "Molar mass HNO3", "Faraday constant"],
} as const;

export type SharedParameters = Pick<Parameters, "capacityHistory" | "population" | "assumptions">;
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
  return { ...data, capacityHistory: shared.capacityHistory, population: shared.population, assumptions };
}
