const endpoint = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const day = 86_400_000;
export type EquipmentExchangeRates = { date: string; rates: Record<string, number> };

export function parseEquipmentExchangeRates(xml: string, now = new Date()): EquipmentExchangeRates {
  const date = xml.match(/<Cube\s+time=['"](\d{4}-\d{2}-\d{2})['"]/i)?.[1];
  const stamp = date ? Date.parse(date + "T00:00:00Z") : NaN;
  if (!date || !Number.isFinite(stamp) || stamp > now.getTime() || now.getTime() - stamp > 7 * day)
    throw Error("fx_date_unavailable");
  const perEuro: Record<string, number> = { EUR: 1 };
  for (const [, currency, raw] of xml.matchAll(/<Cube\s+currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) {
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0) perEuro[currency] = value;
  }
  const usdPerEuro = perEuro.USD;
  if (!usdPerEuro) throw Error("fx_usd_unavailable");
  return { date, rates: Object.fromEntries(Object.entries(perEuro).map(([currency, rate]) => [currency, rate / usdPerEuro])) };
}

export async function loadEquipmentExchangeRates(): Promise<EquipmentExchangeRates | null> {
  try {
    const response = await fetch(endpoint, { next: { revalidate: 900 }, signal: AbortSignal.timeout(4500) });
    if (!response.ok) return null;
    return parseEquipmentExchangeRates(await response.text());
  } catch {
    return null;
  }
}
