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
// written to Assumptions section 12 in every newly exported workbook.
export const websiteDataDefaults: WebsiteData = {
  "stakes.circularity_goal_percent": { section: "Stakes", label: "Circularity goal", value: 100, unit: "%", source: "PV Circonomy goal" },
  "stakes.cost.reference_panel_watts": { section: "Stakes", label: "Cost comparison reference module rating", value: 350, unit: "W", source: "PV Circonomy comparison basis" },
  "stakes.cost.nrel_recycling_low_usd_per_panel": { section: "Stakes", label: "NREL recycling cost, low", value: 15, unit: "USD/panel", source: "NREL/TP-6A20-74550" },
  "stakes.cost.nrel_recycling_high_usd_per_panel": { section: "Stakes", label: "NREL recycling cost, high", value: 45, unit: "USD/panel", source: "NREL/TP-6A20-74550" },
  "stakes.cost.nrel_landfill_low_usd_per_panel": { section: "Stakes", label: "NREL landfill cost, low", value: 1, unit: "USD/panel", source: "NREL/TP-6A20-74550" },
  "stakes.cost.nrel_landfill_high_usd_per_panel": { section: "Stakes", label: "NREL landfill cost, high", value: 5, unit: "USD/panel", source: "NREL/TP-6A20-74550" },
  "methods.shredding.footprint_m2": { section: "Methods", label: "Shredding footprint", value: 480, unit: "m²", source: "TNO 2022 R10860 (Späth et al.), pp. 8, 12, 19" },
  "methods.thermal.footprint_m2": { section: "Methods", label: "Thermal processing footprint", value: 160, unit: "m²", source: "NEDO 2026 A1-2-14 (MRI), p. 8" },
  "methods.circulator.footprint_m2": { section: "Methods", label: "PV Circulator footprint", value: 40, unit: "m²", source: "PV Circulator product specification" },
  "methods.shredding.energy_kwh_per_panel": { section: "Methods", label: "Shredding energy use", value: 5, unit: "kWh/panel", source: "TNO 2022 R10860 (Späth et al.)" },
  "methods.thermal.energy_kwh_per_panel": { section: "Methods", label: "Thermal processing energy use", value: 2.6666666667, unit: "kWh/panel", source: "160 kWh/hour ÷ 60 panels/hour" },
  "methods.circulator.energy_max_kwh_per_panel": { section: "Methods", label: "PV Circulator maximum energy use", value: 1, unit: "kWh/panel", source: "PV Circulator product specification" },
  "methods.shredding.throughput_min_panels_per_hour": { section: "Methods", label: "Shredding throughput, minimum", value: 50, unit: "panels/hour", source: "TNO 2022 R10860 (Späth et al.)" },
  "methods.shredding.throughput_max_panels_per_hour": { section: "Methods", label: "Shredding throughput, maximum", value: 60, unit: "panels/hour", source: "TNO 2022 R10860 (Späth et al.)" },
  "methods.thermal.throughput_panels_per_hour": { section: "Methods", label: "Thermal processing throughput", value: 40, unit: "panels/hour", source: "TNO 2022 App. D.1, pp. 25–26" },
  "methods.thermal.seconds_per_panel": { section: "Methods", label: "Thermal processing cycle time", value: 90, unit: "seconds/panel", source: "TNO 2022 App. D.1, pp. 25–26" },
  "methods.circulator.throughput_panels_per_hour": { section: "Methods", label: "PV Circulator throughput", value: 60, unit: "panels/hour", source: "PV Circulator product specification" },
  "methods.shredding.direct_staff_per_shift": { section: "Methods", label: "Shredding direct staff", value: 3, unit: "people/shift", source: "PV Circonomy staffing comparison" },
  "methods.shredding.indirect_staff_per_shift": { section: "Methods", label: "Shredding indirect staff", value: 2, unit: "people/shift", source: "PV Circonomy staffing comparison" },
  "methods.thermal.direct_staff_per_shift": { section: "Methods", label: "Thermal processing direct staff", value: 2, unit: "people/shift", source: "Thermal processing operating configuration" },
  "methods.thermal.indirect_staff_per_shift": { section: "Methods", label: "Thermal processing indirect staff", value: 2, unit: "people/shift", source: "Thermal processing operating configuration" },
  "methods.circulator.direct_staff_per_shift": { section: "Methods", label: "PV Circulator direct staff", value: 1, unit: "people/shift", source: "PV Circulator operating configuration" },
  "methods.circulator.indirect_staff_per_shift": { section: "Methods", label: "PV Circulator indirect staff", value: 2, unit: "people/shift", source: "PV Circulator operating configuration" },
  "methods.shredding.product_recovery_percent": { section: "Methods", label: "Shredding product recovery upper bound", value: 80, unit: "%", source: "PV Circonomy comparison threshold" },
  "methods.thermal.product_recovery_percent": { section: "Methods", label: "Thermal processing product recovery", value: 88, unit: "%", source: "IEA-PVPS T12-25:2023" },
  "methods.circulator.product_recovery_percent": { section: "Methods", label: "PV Circulator product recovery", value: 99.3, unit: "%", source: "SGS verification" },
  "methods.shredding.secondary_treatment_t_per_mw": { section: "Methods", label: "Shredding secondary treatment", value: 54, unit: "t/MW", source: "TNO 2022 R10860 (Späth et al.)" },
  "methods.circulator.secondary_treatment_t_per_mw": { section: "Methods", label: "PV Circulator secondary treatment", value: 0.5, unit: "t/MW", source: "PV Circulator product specification" },
  "impact.grid_kg_co2e_per_kwh": { section: "Impact", label: "US grid emissions factor", value: 0.3497, unit: "kg CO2e/kWh", source: "EPA eGRID2023 rev2, US total output rate" },
  "materials.silver_demand_recovered_percent": { section: "Materials", label: "Solar-industry silver demand supplied by recovered material", value: 70, unit: "%", source: "IEA assessment" },
  "materials.other_demand_recovered_percent": { section: "Materials", label: "Aluminium, copper, glass and silicon demand supplied by recovered material", value: 20, unit: "%", source: "IEA assessment" },
  "materials.demand_horizon_start_year": { section: "Materials", label: "Recovered-material demand horizon, start", value: 2040, unit: "year", source: "IEA assessment" },
  "materials.demand_horizon_end_year": { section: "Materials", label: "Recovered-material demand horizon, end", value: 2050, unit: "year", source: "IEA assessment" },
  "materials.recycled_aluminium_primary_carbon_percent": { section: "Materials", label: "Recycled aluminium carbon emissions versus primary", value: 3, unit: "%", source: "PV Circonomy materials pathway reference" },
  "value.silver_industry_2024_mg_per_w": { section: "Value", label: "Industry-average silver use, 2024", value: 13, unit: "mg/W", source: "IRENA 2026" },
  "value.silver_topcon_2025_mg_per_w": { section: "Value", label: "TOPCon median silver use, 2025", value: 10, unit: "mg/W", source: "ITRPV, 17th edition (2026)" },
  "value.silver_topcon_2035_mg_per_w": { section: "Value", label: "TOPCon expected silver use, 2035", value: 6.3, unit: "mg/W", source: "ITRPV, 17th edition (2026)" },
  "value.silver_hjt_2025_mg_per_w": { section: "Value", label: "HJT median silver use, 2025", value: 12, unit: "mg/W", source: "ITRPV, 17th edition (2026)" },
  "value.silver_hjt_2035_mg_per_w": { section: "Value", label: "HJT expected silver use, 2035", value: 4.3, unit: "mg/W", source: "ITRPV, 17th edition (2026)" },
  "scale.australia_launch_year": { section: "Scale", label: "Australia launch year", value: 2027, unit: "year", source: "PV Circonomy commercialization plan" },
  "scale.taiwan_launch_year": { section: "Scale", label: "Taiwan launch year", value: 2027, unit: "year", source: "PV Circonomy commercialization plan" },
};

export const websiteAssumptionRows:Record<string,(number|string)[]>=Object.fromEntries(Object.entries(websiteDataDefaults).map(([key,row])=>[key,[row.value,row.unit,row.source,row.section,row.label]]));

export function websiteDataFromAssumptions(assumptions:Record<string,Record<string,(number|string)[]>>):WebsiteData {
  const rows=assumptions['12']??{};
  return Object.fromEntries(Object.entries(websiteDataDefaults).map(([key,fallback])=>{const row=rows[key]??websiteAssumptionRows[key];return [key,{value:row[0],unit:String(row[1]),source:String(row[2]),section:String(row[3]),label:String(row[4])}]}));
}

export function websiteNumber(data: WebsiteData, key: keyof typeof websiteDataDefaults | string): number {
  const value = data[key]?.value;
  if (typeof value !== "number" || !Number.isFinite(value)) throw Error(`Assumptions section 12 ${key} must be a finite number.`);
  return value;
}

