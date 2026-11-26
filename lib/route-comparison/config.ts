/** Andrew decision pending (2026-11-22): show competitor-route profit $ publicly? Default false. */
export const SHOW_COMPETITOR_PROFIT = false;
export const REFERENCE_CASE = { regionCode: "US-CA", panelsPerMonth: 10400, processingFee: 0.20, panelWeightLb: 44.09245243697551, panelWatts: 300 } as const;
export const JAPAN_REFERENCE_CASE = { regionCode: "JP", panelsPerMonth: 13888.89, processingFee: 100, panelWeightKg: 20, panelWatts: 300 } as const;
export type ReferenceCase = typeof REFERENCE_CASE | typeof JAPAN_REFERENCE_CASE;
export const GRID_KG_CO2E_PER_KWH = 0.3497; // EPA eGRID2023 rev2 US total output rate 770.884 lb/MWh
