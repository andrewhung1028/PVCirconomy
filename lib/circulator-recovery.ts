// Mass fractions. The three separated streams are recovered in full on the standard line.
export const standardRecovery = 0.993;
const completeStreams = new Set(["Glass", "Aluminium", "Junction box", "GLASS", "ALUMINUM", "JUNCTION_BOX"]);

export function economicRecovery(name: string) {
  if (name === "Backsheet") return 0;
  if (name === "EVA") return 0.5;
  return 1;
}

type Material = { name: string; share: number; rate: number };

export function standardRecoveryRates(materials: Material[]) {
  const rates = new Map(materials.map(m => [m.name, 1]));
  let remainingLoss = materials.reduce((sum, m) => sum + m.share, 0) * (1 - standardRecovery);
  let adjustable = materials.filter(m => m.share > 0 && !completeStreams.has(m.name));
  // Distribute losses in proportion to the published material loss rates.
  // Exhaust a stream first if a different composition would require recovery below zero.
  while (adjustable.length && remainingLoss > 0) {
    const weightedLoss = adjustable.reduce((sum, m) => sum + m.share * (1 - m.rate), 0);
    const denominator = weightedLoss || adjustable.reduce((sum, m) => sum + m.share, 0);
    const lossRate = (m: Material) => remainingLoss * (weightedLoss ? 1 - m.rate : 1) / denominator;
    const saturated = adjustable.filter(m => lossRate(m) >= 1);
    if (!saturated.length) {
      for (const m of adjustable) rates.set(m.name, 1 - lossRate(m));
      break;
    }
    for (const m of saturated) {
      rates.set(m.name, 0);
      remainingLoss -= m.share;
    }
    adjustable = adjustable.filter(m => !saturated.includes(m));
  }
  return rates;
}
