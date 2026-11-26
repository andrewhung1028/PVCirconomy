// Public availability gate: keep this single list reviewable for a staged release.
const SUPPORTED_COUNTRY_CODES = new Set(['CA', 'US', 'JP', 'AU', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH', 'NO']);

export function isSupportedCountry(countryCode: string): boolean {
  return SUPPORTED_COUNTRY_CODES.has(countryCode.trim().toUpperCase());
}
