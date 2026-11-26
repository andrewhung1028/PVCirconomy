// Couriers & Freight, Single Full Truck Load Rates, 13 April 2026.
// Distances are approximate road distances published by Full Truck Loads.
export const australiaFreightSource = "https://www.couriersandfreight.com.au/blog/current-full-truck-load-rates";
const bookingFeeAud = 50;
const routes = [
  { name: "Melbourne ↔ Adelaide", distanceKm: 725, outbound: 1879.50, inbound: 997.50 },
  { name: "Sydney ↔ Melbourne", distanceKm: 880, outbound: 1470, inbound: 1995 },
  { name: "Sydney ↔ Brisbane", distanceKm: 920, outbound: 2520, inbound: 1417.50 },
];

export const australiaFreightReference = routes.map(route => ({
  ...route,
  averagePerTripAud: (route.outbound + route.inbound) / 2 + bookingFeeAud,
}));
