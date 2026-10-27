// Illustrative settings only. Replace after commercial rates and load planning are confirmed.
export const recyclingDefaults = {
  modelId: 'reference-silicon', modelName: 'Reference silicon panel', weightLb: 50,
  dropoffPanels: 100, trailerPanels: 720, palletsPerTrailer: 24,
  pickupCity: 'Menifee', pickupState: 'CA', pickupZip: '92584',
  baseRate: 10, volumeRate: 8, trailerRate: 6, volumeThreshold: 100, pickupTransport: 250,
} as const;
export type RecyclingMethod = 'dropoff' | 'pickup' | 'project';
export function panelQuantity(value: string | null, fallback: number) {
  const n = Number(value); return Number.isInteger(n) && n >= 1 && n <= 1000000 ? n : fallback;
}
export function estimateRecycling({ method, quantity, modelId = recyclingDefaults.modelId, state = 'CA', zip = recyclingDefaults.pickupZip, condition = 'intact' }: { method: RecyclingMethod; quantity: number; modelId?: string; state?: string; zip?: string; condition?: string }) {
  const valid = Number.isInteger(quantity) && quantity >= 1 && quantity <= 1000000;
  const project = method === 'project' || state.trim().toUpperCase() !== 'CA';
  const rate = method === 'pickup' && quantity >= recyclingDefaults.trailerPanels ? recyclingDefaults.trailerRate : quantity >= recyclingDefaults.volumeThreshold ? recyclingDefaults.volumeRate : recyclingDefaults.baseRate;
  const processing = valid ? quantity * rate : null;
  let reason = !valid ? 'Enter a whole number between 1 and 1,000,000.' : project ? 'Transport outside California and custom projects are handled by Project Support.' : modelId !== recyclingDefaults.modelId ? 'Confirm the panel model before receiving a price.' : condition !== 'intact' ? 'Panel condition requires acceptance and pricing review.' : method === 'pickup' && quantity > recyclingDefaults.trailerPanels ? 'This quantity exceeds the reference trailer load. Confirm the load plan.' : method === 'pickup' && zip !== recyclingDefaults.pickupZip ? 'Pickup transport must be quoted for this ZIP code.' : '';
  const transport = method === 'pickup' ? recyclingDefaults.pickupTransport : 0;
  const total = reason || processing === null ? null : processing + transport;
  return { valid, project, reason, rate, processing, transport, total, effectiveRate: total === null ? null : total / quantity };
}
