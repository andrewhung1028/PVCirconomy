export type WebsiteDataRecord = {
  section: string;
  label: string;
  value: number | string;
  unit: string;
  source: string;
};

export type WebsiteData = Record<string, WebsiteDataRecord>;

// Public claims that are not calculated by the Our Solution parameter engine.
// These defaults preserve the currently approved website values and are also
// written to the Website Data sheet in every newly exported workbook.
export const websiteDataDefaults: WebsiteData = {
  "stakes.cost_goal_years_min": { section: "Stakes", label: "Cost goal, minimum years", value: 3, unit: "years", source: "PV Circonomy goal" },
  "stakes.cost_goal_years_max": { section: "Stakes", label: "Cost goal, maximum years", value: 5, unit: "years", source: "PV Circonomy goal" },
  "stakes.circularity_goal_percent": { section: "Stakes", label: "Circularity goal", value: 100, unit: "%", source: "PV Circonomy goal" },
  "methods.shredding.footprint_m2": { section: "Methods", label: "Shredding footprint", value: 480, unit: "m²", source: "TNO 2022 R10860 (Späth et al.), pp. 8, 12, 19" },
  "methods.thermal.footprint_m2": { section: "Methods", label: "Thermal processing footprint", value: 160, unit: "m²", source: "NEDO 2026 A1-2-14 (MRI), p. 8" },
  "methods.circulator.footprint_min_m2": { section: "Methods", label: "PV Circulator footprint, minimum", value: 30, unit: "m²", source: "PV Circulator product specification" },
  "methods.circulator.footprint_max_m2": { section: "Methods", label: "PV Circulator footprint, maximum", value: 40, unit: "m²", source: "PV Circulator product specification" },
  "methods.shredding.energy_kwh_per_panel": { section: "Methods", label: "Shredding energy use", value: 5, unit: "kWh/panel", source: "TNO 2022 R10860 (Späth et al.)" },
  "methods.thermal.energy_display": { section: "Methods", label: "Thermal processing energy display", value: "—", unit: "text", source: "No public comparable figure" },
  "methods.circulator.energy_max_kwh_per_panel": { section: "Methods", label: "PV Circulator maximum energy use", value: 1, unit: "kWh/panel", source: "PV Circulator product specification" },
  "methods.shredding.throughput_min_panels_per_hour": { section: "Methods", label: "Shredding throughput, minimum", value: 50, unit: "panels/hour", source: "TNO 2022 R10860 (Späth et al.)" },
  "methods.shredding.throughput_max_panels_per_hour": { section: "Methods", label: "Shredding throughput, maximum", value: 60, unit: "panels/hour", source: "TNO 2022 R10860 (Späth et al.)" },
  "methods.thermal.throughput_panels_per_hour": { section: "Methods", label: "Thermal processing throughput", value: 40, unit: "panels/hour", source: "TNO 2022 App. D.1, pp. 25–26" },
  "methods.thermal.seconds_per_panel": { section: "Methods", label: "Thermal processing cycle time", value: 90, unit: "seconds/panel", source: "TNO 2022 App. D.1, pp. 25–26" },
  "methods.circulator.throughput_panels_per_hour": { section: "Methods", label: "PV Circulator throughput", value: 60, unit: "panels/hour", source: "PV Circulator product specification" },
  "methods.shredding.staff_per_shift": { section: "Methods", label: "Shredding staff", value: 5, unit: "people/shift", source: "TNO 2022 R10860 (Späth et al.)" },
  "methods.thermal.staff_display": { section: "Methods", label: "Thermal processing staff display", value: "—", unit: "text", source: "No public comparable figure" },
  "methods.circulator.direct_staff_per_shift": { section: "Methods", label: "PV Circulator direct staff", value: 1, unit: "people/shift", source: "PV Circulator operating configuration" },
  "methods.circulator.indirect_staff_per_shift": { section: "Methods", label: "PV Circulator indirect staff", value: 2, unit: "people/shift", source: "PV Circulator operating configuration" },
  "methods.shredding.product_recovery_percent": { section: "Methods", label: "Shredding product recovery", value: 19, unit: "%", source: "TNO 2022 R10860 (Späth et al.)" },
  "methods.thermal.product_recovery_percent": { section: "Methods", label: "Thermal processing product recovery", value: 88, unit: "%", source: "IEA-PVPS T12-25:2023" },
  "methods.circulator.product_recovery_percent": { section: "Methods", label: "PV Circulator product recovery", value: 99.3, unit: "%", source: "SGS verification" },
  "methods.shredding.secondary_treatment_t_per_mw": { section: "Methods", label: "Shredding secondary treatment", value: 54, unit: "t/MW", source: "TNO 2022 R10860 (Späth et al.)" },
  "methods.thermal.secondary_treatment_display": { section: "Methods", label: "Thermal processing secondary treatment display", value: "—", unit: "text", source: "No public comparable figure" },
  "methods.circulator.secondary_treatment_t_per_mw": { section: "Methods", label: "PV Circulator secondary treatment", value: 0.5, unit: "t/MW", source: "PV Circulator product specification" },
  "impact.grid_kg_co2e_per_kwh": { section: "Impact", label: "US grid emissions factor", value: 0.3497, unit: "kg CO2e/kWh", source: "EPA eGRID2023 rev2, US total output rate" },
  "materials.silver_demand_recovered_percent": { section: "Materials", label: "Solar-industry silver demand supplied by recovered material", value: 70, unit: "%", source: "IEA assessment" },
  "materials.other_demand_recovered_percent": { section: "Materials", label: "Aluminium, copper, glass and silicon demand supplied by recovered material", value: 20, unit: "%", source: "IEA assessment" },
  "materials.demand_horizon_start_year": { section: "Materials", label: "Recovered-material demand horizon, start", value: 2040, unit: "year", source: "IEA assessment" },
  "materials.demand_horizon_end_year": { section: "Materials", label: "Recovered-material demand horizon, end", value: 2050, unit: "year", source: "IEA assessment" },
  "materials.recycled_aluminium_primary_carbon_percent": { section: "Materials", label: "Recycled aluminium carbon emissions versus primary", value: 3, unit: "%", source: "PV Circonomy materials pathway reference" },
  "scale.australia_launch_year": { section: "Scale", label: "Australia launch year", value: 2027, unit: "year", source: "PV Circonomy commercialization plan" },
  "scale.taiwan_launch_year": { section: "Scale", label: "Taiwan launch year", value: 2027, unit: "year", source: "PV Circonomy commercialization plan" },
};

export function websiteDataWithDefaults(value: unknown): WebsiteData {
  const input = value && typeof value === "object" ? value as WebsiteData : {};
  return Object.fromEntries(Object.entries(websiteDataDefaults).map(([key, fallback]) => [key, { ...fallback, ...(input[key] ?? {}) }]));
}

export function websiteNumber(data: WebsiteData, key: keyof typeof websiteDataDefaults | string): number {
  const value = data[key]?.value;
  if (typeof value !== "number" || !Number.isFinite(value)) throw Error(`Website Data ${key} must be a finite number.`);
  return value;
}

export function websiteString(data: WebsiteData, key: keyof typeof websiteDataDefaults | string): string {
  const value = data[key]?.value;
  if (typeof value !== "string" || !value.trim()) throw Error(`Website Data ${key} must be text.`);
  return value;
}
