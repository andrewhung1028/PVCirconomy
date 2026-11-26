export type RegionPresentation = {
  countryCode?: string | null;
  currency?: string | null;
};

export const localeForRegion = (region?: RegionPresentation | null) =>
  String(region?.countryCode || '').toUpperCase() === 'JP' || String(region?.currency || '').toUpperCase() === 'JPY'
    ? 'ja-JP'
    : 'en-US';

export function formatCurrency(
  value: number,
  region: RegionPresentation | null | undefined,
  options: Intl.NumberFormatOptions = {},
) {
  const currency = String(region?.currency || 'USD').toUpperCase();
  const yen = currency === 'JPY';
  return new Intl.NumberFormat(localeForRegion(region), {
    style: 'currency',
    currency,
    minimumFractionDigits: yen ? 0 : options.minimumFractionDigits,
    maximumFractionDigits: yen ? 0 : options.maximumFractionDigits,
    ...options,
    ...(yen ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
  }).format(Number(value || 0));
}

export function formatRegionNumber(
  value: number,
  region: RegionPresentation | null | undefined,
  options: Intl.NumberFormatOptions = {},
) {
  return new Intl.NumberFormat(localeForRegion(region), options).format(Number(value || 0));
}

export const isJapaneseRegion = (region?: RegionPresentation | null) =>
  localeForRegion(region) === 'ja-JP';
