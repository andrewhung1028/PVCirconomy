import { deliverySettings } from "../delivery/store";
import { validDeliverySettings, type DeliverySettings } from "../../lib/delivery";
import type { OurSolutionParameterMarket } from "../../lib/our-solution/market";
import { emptyMarketTransport, transportVehicles, type MarketTransport } from "../../lib/our-solution/transport";

function fromDeliverySettings(settings: DeliverySettings, palletAreaM2: number): MarketTransport | undefined {
  const { maxPanelsPerPallet, palletTareLb, truckMaxWeightLb, trailerMaxWeightLb } = settings.transport;
  const transport = emptyMarketTransport();
  transport.maxPanelsPerPallet = maxPanelsPerPallet;
  transport.palletTare = palletTareLb;
  // Match the existing pickup area approximation (one metre wide) until measured
  // loaded pallet dimensions are entered in the US workbook.
  transport.palletWidthM = 1;
  transport.palletLengthM = palletAreaM2;
  for (const vehicle of transportVehicles) {
    const maxWeight = vehicle === "truck" ? truckMaxWeightLb : trailerMaxWeightLb;
    const { base, perMile, minimum } = settings.rates[vehicle];
    if (maxWeight === null || base === null || perMile === null || minimum === null) continue;
    const length = vehicle === "truck" ? settings.transport.truckInteriorLengthIn : settings.transport.trailerInteriorLengthIn;
    const width = vehicle === "truck" ? settings.transport.truckInteriorWidthIn : settings.transport.trailerInteriorWidthIn;
    transport.vehicles[vehicle] = { maxWeight, lengthM: length * 0.0254, widthM: width * 0.0254, base, perDistance: perMile, minimum };
  }
  return transportVehicles.some(vehicle => transport.vehicles[vehicle].maxWeight !== null) ? transport : undefined;
}

export async function resolveMarketTransport(market: OurSolutionParameterMarket, configured: MarketTransport | undefined, palletAreaM2: number) {
  if (market !== "US" || (configured && transportVehicles.some(vehicle => configured.vehicles[vehicle].maxWeight !== null))) return configured;
  const delivery = await deliverySettings().catch(() => null);
  const legacy = delivery ? fromDeliverySettings(delivery.settings, palletAreaM2) : undefined;
  if (legacy) return { ...legacy, ...(configured?.referencePoints && { referencePoints: configured.referencePoints }) };
  if (process.env.VERCEL_ENV !== "preview") return configured;
  try {
    const response = await fetch("https://www.pvcirconomy.com/api/delivery/settings/", {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 60 },
    });
    if (!response.ok) return configured;
    const { settings } = await response.json() as { settings?: unknown };
    const preview = validDeliverySettings(settings) ? fromDeliverySettings(settings, palletAreaM2) : undefined;
    return preview ? { ...preview, ...(configured?.referencePoints && { referencePoints: configured.referencePoints }) } : configured;
  } catch {
    return configured;
  }
}
