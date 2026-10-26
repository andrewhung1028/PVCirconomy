const SUPPORTED_COUNTRY_CODES = new Set(['CA', 'US', 'AU']);

export function isSupportedCountry(countryCode: string): boolean {
  return SUPPORTED_COUNTRY_CODES.has(countryCode.trim().toUpperCase());
}
