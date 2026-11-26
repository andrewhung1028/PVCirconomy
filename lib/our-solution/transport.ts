import { freightChargeForVehicle } from "../delivery";
import type { OurSolutionParameterMarket } from "./market";

export const transportVehicles = ["truck", "trailer"] as const;

export type FreightPoint = { distance: number; cost: number };

export type MarketTransport = {
  referencePoints?: FreightPoint[];
  maxPanelsPerPallet: number | null;
  palletTare: number | null;
  palletLengthM: number | null;
  palletWidthM: number | null;
  vehicles: Record<typeof transportVehicles[number], {
    maxWeight: number | null;
    lengthM: number | null;
    widthM: number | null;
    base: number | null;
    perDistance: number | null;
    minimum: number | null;
  }>;
};

export function transportUnits(market: OurSolutionParameterMarket) {
  return { distance: market === "US" || market === "UK" ? "mi" : "km", weight: market === "US" ? "lb" : "kg" } as const;
}

export function emptyMarketTransport(): MarketTransport {
  const empty = { maxWeight: null, lengthM: null, widthM: null, base: null, perDistance: null, minimum: null };
  return { maxPanelsPerPallet: null, palletTare: null, palletLengthM: null, palletWidthM: null, vehicles: { truck: { ...empty }, trailer: { ...empty } } };
}

export function validateMarketTransport(value: unknown): string[] {
  const transport = value as MarketTransport | undefined;
  const nonnegative = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1_000_000;
  const errors: string[] = [];
  if (!transport || !transport.vehicles) return ["Transport 欄位不完整。"];
  const points = transport.referencePoints;
  if (points !== undefined && (!Array.isArray(points) || points.length < 2 || points.length > 6
    || points.some((p,i)=>!p || !nonnegative(p.distance) || !nonnegative(p.cost) || (i===0 ? p.distance!==0 || p.cost!==0 : p.distance<=points[i-1].distance)))) {
    errors.push("Transport · 運費參考點須從 0 距離、0 費用開始，距離依序遞增。");
  }
  if (transport.maxPanelsPerPallet !== null && (!nonnegative(transport.maxPanelsPerPallet) || !Number.isInteger(transport.maxPanelsPerPallet) || transport.maxPanelsPerPallet < 1)) errors.push("Transport · max_panels_per_pallet 必須為正整數。");
  if (transport.palletTare !== null && !nonnegative(transport.palletTare)) errors.push("Transport · pallet_tare 必須為非負數字。");
  const validLength = (n: unknown) => n === null || (nonnegative(n) && n > 0 && n <= 100);
  if (!validLength(transport.palletLengthM) || !validLength(transport.palletWidthM)) errors.push("Transport · 棧板長寬必須為正數（m）。");
  for (const key of transportVehicles) {
    const vehicle = transport.vehicles[key];
    if (!vehicle || !validLength(vehicle.lengthM) || !validLength(vehicle.widthM) || ![vehicle.maxWeight, vehicle.base, vehicle.perDistance, vehicle.minimum].every(n => n === null || nonnegative(n)) || vehicle.maxWeight === 0) {
      errors.push(`Transport · ${key} 的運費必須為非負數字，載重必須大於零。`);
    } else if ([vehicle.maxWeight, vehicle.lengthM, vehicle.widthM, vehicle.base, vehicle.perDistance, vehicle.minimum].some(n => n !== null) &&
      [vehicle.maxWeight, vehicle.lengthM, vehicle.widthM, vehicle.base, vehicle.perDistance, vehicle.minimum, transport.maxPanelsPerPallet, transport.palletTare, transport.palletLengthM, transport.palletWidthM].some(n => n === null)) {
      errors.push(`Transport · ${key} 必須填妥載重、車廂內長寬、起始費、距離費率、最低運費及共用棧板數值。`);
    }
  }
  return errors;
}

function panelsByWeight(limit: number, panel: number, perPallet: number, tare: number) {
  const fullWeight = perPallet * panel + tare;
  const fullPallets = Math.floor(limit / fullWeight);
  const remainder = limit - fullPallets * fullWeight;
  return fullPallets * perPallet + Math.max(0, Math.floor((remainder - tare) / panel));
}

export function estimateAnnualFreight(pricing: MarketTransport, annualPanels: number, panelWeight: number, distances: number[]) {
  const { maxPanelsPerPallet, palletTare, palletLengthM, palletWidthM } = pricing;
  if (!maxPanelsPerPallet || palletTare === null || !palletLengthM || !palletWidthM ||
    !Number.isFinite(panelWeight) || panelWeight <= 0 || !Number.isFinite(annualPanels) || annualPanels < 0) return null;
  const options = transportVehicles.flatMap(vehicle => {
    const { maxWeight, lengthM, widthM, base, minimum, perDistance } = pricing.vehicles[vehicle];
    if (maxWeight === null || lengthM === null || widthM === null || base === null || minimum === null || perDistance === null) return [];
    const palletSlots = Math.max(
      Math.floor(lengthM / palletLengthM) * Math.floor(widthM / palletWidthM),
      Math.floor(lengthM / palletWidthM) * Math.floor(widthM / palletLengthM),
    );
    const panelsPerLoad = Math.min(palletSlots * maxPanelsPerPallet, panelsByWeight(maxWeight, panelWeight, maxPanelsPerPallet, palletTare));
    if (!panelsPerLoad) return [];
    return [{ vehicle, palletSlots, panelsPerLoad, rate: { base, minimum, perMile: perDistance }, trips: Math.ceil(annualPanels / panelsPerLoad) }];
  });
  if (!options.length || distances.some(distance => !Number.isFinite(distance) || distance < 0)) return null;
  return distances.map(distance => {
    if (distance === 0) return { vehicle: null, palletSlots: 0, panelsPerLoad: 0, trips: 0, tripCost: 0, total: 0 };
    const [first, ...rest] = options;
    function freight(option: typeof first) {
      const tripCost = freightChargeForVehicle(distance, option.rate)!;
      return { ...option, tripCost, total: tripCost * option.trips };
    }
    const initial = freight(first);
    return rest.reduce<typeof initial>((lowest, option) => {
      const cost = freight(option);
      return cost.total < lowest.total ? cost : lowest;
    }, initial);
  });
}
