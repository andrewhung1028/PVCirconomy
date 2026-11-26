import { australiaFreightReference } from "./australia-freight-reference";
import { japanKantoTrailerFreight } from "./japan-freight-reference";
import type { PublicSolutionMarket } from "./market";

export const freightDistanceSteps = [0, 200, 400, 600, 800, 1000];
import type { FreightPoint } from "./transport";
const onSite: FreightPoint = { distance: 0, cost: 0 };

function points(samples: [number, number][]): FreightPoint[] {
  return [onSite, ...samples.map(([distance, cost]) => ({ distance, cost }))];
}

export function freightCostTrend(market: PublicSolutionMarket): FreightPoint[] {
  switch (market) {
    case "US":
      // Warp published 53 ft dry van lane prices from Los Angeles to San Diego, San Francisco,
      // Salt Lake City, and Portland. Their quoted distances are in miles.
      // https://www.wearewarp.com/truckload/los-angeles-to-san-diego
      return points([[121, 715], [382, 1200], [688, 3658], [962, 4557]]);
    case "JP":
      return freightDistanceSteps.map(distance => ({ distance, cost: japanKantoTrailerFreight(distance)! }));
    case "AU":
      return [onSite, ...australiaFreightReference.map(({ distanceKm, averagePerTripAud }) => ({ distance: distanceKm, cost: averagePerTripAud }))];
    case "CA": {
      // FreightFA's CAD dry van benchmarks for Toronto to Montréal and Toronto to Winnipeg.
      // https://freightfa.com/lanes/toronto-on-to-montreal-qc
      // https://freightfa.com/lanes/toronto-on-to-winnipeg-mb
      const montreal = { distance: 544, cost: 1605 };
      const winnipeg = { distance: 2068, cost: 5710 };
      const distance = freightDistanceSteps[freightDistanceSteps.length - 1];
      const fraction = (distance - montreal.distance) / (winnipeg.distance - montreal.distance);
      return [onSite, montreal, { distance, cost: montreal.cost + fraction * (winnipeg.cost - montreal.cost) }];
    }
    case "UK":
      // Road Haulage Services publishes a 44-tonne artic benchmark from GBP 3 per mile.
      // https://www.roadhaulageservices.com/haulage-rates/
      return freightDistanceSteps.map(distance => ({ distance, cost: distance * 3 }));
    case "EU": {
      // Trans-road commercial FTL examples. Use the midpoint of the 200 and 2,000 km
      // scenarios and interpolate to the chart limit. No extrapolation past the longer example.
      // https://www.trans-road.com/en/freight-rates/cost-per-km-europe
      const local = { distance: 200, cost: (360 + 500) / 2 };
      const crossBorder = { distance: 2000, cost: (2200 + 3000) / 2 };
      const distance = freightDistanceSteps[freightDistanceSteps.length - 1];
      const fraction = (distance - local.distance) / (crossBorder.distance - local.distance);
      return [onSite, local, { distance, cost: local.cost + fraction * (crossBorder.cost - local.cost) }];
    }
  }
}
