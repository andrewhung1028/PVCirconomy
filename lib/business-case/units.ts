/** Explicit money-unit vocabulary shared by workbook validation and the engine. */
export const REGION_UNIT_SUFFIXES = {
  feeUnit: ['/kg', '/lb'],
  wageUnit: ['/hour'],
  rentUnit: ['/sq.ft./year'],
  electricityUnit: ['/kWh'],
  landfillUnit: ['/short ton', '/metric ton', '/metric tonne'],
} as const;
export function unitCurrency(unit: string): string {
  return unit.split('/')[0].trim().toUpperCase();
}
export function unitSuffix(unit: string): string {
  const slash = unit.indexOf('/');
  return slash < 0 ? '' : unit.slice(slash);
}
export function checkRegionUnit(field: keyof typeof REGION_UNIT_SUFFIXES, unit: string, currency: string): void {
  if (!(REGION_UNIT_SUFFIXES[field] as readonly string[]).includes(unitSuffix(unit))) {
    throw Error(`Unknown unit ${unit} for ${field}`);
  }
  if (unitCurrency(unit) !== currency) {
    throw Error(`Unit currency ${unitCurrency(unit)} must equal region currency ${currency} for ${field}`);
  }
}
export function checkMaterialUnit(unit: string): void {
  if (unit !== 'N/A' && !['/metric ton', '/metric tonne', '/lb'].includes(unitSuffix(unit))) {
    throw Error(`Unknown material price unit ${unit}`);
  }
}
