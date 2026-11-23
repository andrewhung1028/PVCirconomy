// US end-of-life PV panel mass, IRENA/IEA-PVPS 2016 Weibull model.
// F(t) = 1 − exp(−(t/T)^α); early loss α = 2.4928, regular loss α = 5.3759.
// Rules (Andrew, t524u):
//  1. Panels installed in year v produce no waste in year v: retirement probability at age a ≥ 1 is F(a) − F(a−1).
//  2. Retired capacity is replaced: Added(t) = [Cum(t) − Cum(t−1)] + Retired(t), with
//     Retired(t) = Σ_{v<t} Added(v) × [F(t−v) − F(t−v−1)]. Replacement panels retire again.
// Mass uses scenario panel weight and panel rating, constant for every vintage.
// Cum(t) comes from the published Capacity History parameters (US, 2000–2050). Stock before 2000 enters as the 2000 vintage.
export const WEIBULL_ALPHA = { regular: 5.3759, early: 2.4928 } as const;
export const LIFETIMES = [25, 18, 15, 12] as const;
export type Lifetime = (typeof LIFETIMES)[number];
export const DEFAULT_LIFETIME: Lifetime = 18;
export const WAVE_FIRST_YEAR = 2016;
export const WAVE_LAST_YEAR = 2050;
const THRESHOLDS = [100000, 500000, 1000000] as const;
type SeriesKey = `${"early" | "regular"}_T${Lifetime}`;
export type RetirementWave = { years: number[]; crossings: Record<SeriesKey, Record<"100000" | "500000" | "1000000", number | ">2050">> } & Record<SeriesKey, number[]>;

/** Fixed module mass from the Our Solution scenario (45 lb, 350 W by default). */
export function tonnesPerMw(_year?: number) { return 45 * 0.45359237 * 1e6 / 350 / 1000; }
const cdf = (age: number, lifetime: number, alpha: number) => age <= 0 ? 0 : 1 - Math.exp(-((age / lifetime) ** alpha));

/** Annual retired capacity (MW) and mass (t) for one lifetime/shape pair. */
export function retirementSeries(cumulativeMw: Map<number, number>, lifetime: number, alpha: number, tonnesPerMW = tonnesPerMw()) {
  const years = [...cumulativeMw.keys()].sort((a, b) => a - b);
  const first = years[0], last = years[years.length - 1];
  const added = new Map<number, number>(), retiredMw = new Map<number, number>(), mass = new Map<number, number>();
  for (let year = first; year <= last; year++) {
    if (!cumulativeMw.has(year)) throw Error(`missing cumulative capacity for ${year}`);
    let retired = 0, tonnes = 0;
    for (let vintage = first; vintage < year; vintage++) {
      const share = cdf(year - vintage, lifetime, alpha) - cdf(year - vintage - 1, lifetime, alpha);
      retired += added.get(vintage)! * share;
      tonnes += added.get(vintage)! * share * tonnesPerMW;
    }
    const net = cumulativeMw.get(year)! - (year === first ? 0 : cumulativeMw.get(year - 1)!);
    retiredMw.set(year, retired); mass.set(year, tonnes); added.set(year, Math.max(0, net + retired));
  }
  return { added, retiredMw, mass };
}

export function computeRetirementWave(cumulativeMw: Map<number, number>, tonnesPerMW = tonnesPerMw(), shapes: {early:number;regular:number} = WEIBULL_ALPHA): RetirementWave {
  const years = Array.from({ length: WAVE_LAST_YEAR - WAVE_FIRST_YEAR + 1 }, (_, index) => WAVE_FIRST_YEAR + index);
  const wave = { years, crossings: {} } as RetirementWave;
  for (const lifetime of LIFETIMES) for (const loss of ["regular", "early"] as const) {
    const key = `${loss}_T${lifetime}` as SeriesKey;
    const { mass } = retirementSeries(cumulativeMw, lifetime, shapes[loss], tonnesPerMW);
    const all = [...mass.keys()].sort((a, b) => a - b);
    wave[key] = years.map((year) => Math.round(mass.get(year) ?? 0));
    wave.crossings[key] = Object.fromEntries(THRESHOLDS.map((threshold) => [String(threshold), all.find((year) => year <= WAVE_LAST_YEAR && mass.get(year)! >= threshold) ?? ">2050"])) as RetirementWave["crossings"][SeriesKey];
  }
  return wave;
}
