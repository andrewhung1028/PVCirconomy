// US end-of-life PV panel mass, IRENA/IEA-PVPS 2016 Weibull model.
// F(t) = 1 − exp(−(t/T)^α); early loss α = 2.4928, regular loss α = 5.3759.
// Rules (Andrew, t524u):
//  1. Panels installed in year v produce no waste in year v: retirement probability at age a ≥ 1 is F(a) − F(a−1).
//  2. Retired capacity is replaced: Added(t) = [Cum(t) − Cum(t−1)] + Retired(t), with
//     Retired(t) = Σ_{v<t} Added(v) × [F(t−v) − F(t−v−1)]. Replacement panels retire again.
//  Mass(t) = Σ_{v<t} Added(v) × [F(t−v) − F(t−v−1)] × t/MW for vintage v (IRENA 2026).
// Cum(t) comes from the published Market Capacity sheet (US, 2000–2050). Stock before 2000 enters as the 2000 vintage.
export const WEIBULL_ALPHA = { regular: 5.3759, early: 2.4928 } as const;
export const LIFETIMES = [25, 18, 15, 12] as const;
export type Lifetime = (typeof LIFETIMES)[number];
export const DEFAULT_LIFETIME: Lifetime = 18;
export const WAVE_FIRST_YEAR = 2016;
export const WAVE_LAST_YEAR = 2050;
const THRESHOLDS = [100000, 500000, 1000000] as const;
type SeriesKey = `${"early" | "regular"}_T${Lifetime}`;
export type RetirementWave = { years: number[]; crossings: Record<SeriesKey, Record<"100000" | "500000" | "1000000", number | ">2050">> } & Record<SeriesKey, number[]>;

const m2014 = 60 / 0.73, m2024 = 60, m2035 = 60 * 0.88;
/** Panel mass, metric tonnes per MW, by installation vintage (IRENA 2026 p.14). */
export function tonnesPerMw(year: number) {
  if (year <= 2014) return m2014;
  if (year <= 2024) return m2014 * (m2024 / m2014) ** ((year - 2014) / 10);
  if (year <= 2035) return m2024 * (m2035 / m2024) ** ((year - 2024) / 11);
  return m2035;
}
const cdf = (age: number, lifetime: number, alpha: number) => age <= 0 ? 0 : 1 - Math.exp(-((age / lifetime) ** alpha));

/** Annual retired capacity (MW) and mass (t) for one lifetime/shape pair. */
export function retirementSeries(cumulativeMw: Map<number, number>, lifetime: number, alpha: number) {
  const years = [...cumulativeMw.keys()].sort((a, b) => a - b);
  const first = years[0], last = years[years.length - 1];
  const added = new Map<number, number>(), retiredMw = new Map<number, number>(), mass = new Map<number, number>();
  for (let year = first; year <= last; year++) {
    if (!cumulativeMw.has(year)) throw Error(`missing cumulative capacity for ${year}`);
    let retired = 0, tonnes = 0;
    for (let vintage = first; vintage < year; vintage++) {
      const share = cdf(year - vintage, lifetime, alpha) - cdf(year - vintage - 1, lifetime, alpha);
      retired += added.get(vintage)! * share;
      tonnes += added.get(vintage)! * share * tonnesPerMw(vintage);
    }
    const net = cumulativeMw.get(year)! - (year === first ? 0 : cumulativeMw.get(year - 1)!);
    retiredMw.set(year, retired); mass.set(year, tonnes); added.set(year, net + retired);
  }
  return { added, retiredMw, mass };
}

export function computeRetirementWave(cumulativeMw: Map<number, number>): RetirementWave {
  const years = Array.from({ length: WAVE_LAST_YEAR - WAVE_FIRST_YEAR + 1 }, (_, index) => WAVE_FIRST_YEAR + index);
  const wave = { years, crossings: {} } as RetirementWave;
  for (const lifetime of LIFETIMES) for (const loss of ["regular", "early"] as const) {
    const key = `${loss}_T${lifetime}` as SeriesKey;
    const { mass } = retirementSeries(cumulativeMw, lifetime, WEIBULL_ALPHA[loss]);
    const all = [...mass.keys()].sort((a, b) => a - b);
    wave[key] = years.map((year) => Math.round(mass.get(year) ?? 0));
    wave.crossings[key] = Object.fromEntries(THRESHOLDS.map((threshold) => [String(threshold), all.find((year) => year <= WAVE_LAST_YEAR && mass.get(year)! >= threshold) ?? ">2050"])) as RetirementWave["crossings"][SeriesKey];
  }
  return wave;
}
