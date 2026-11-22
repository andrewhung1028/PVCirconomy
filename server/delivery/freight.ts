import {
  pickupCharges,
  capacityFits,
  loadingNeedsReview,
  type PickupDetails,
} from "../../lib/pickup";
import { cargoTotals } from "../../lib/pickup-cargo";
import { createHash } from "node:crypto";
import { database } from "../db/client";
import {
  calculateFreight,
  type Booking,
  type OriginAddress,
  type DeliverySnapshot,
} from "../../lib/delivery";
import { type StoredQuote } from "./quotations";
export function freightFingerprint(
  origin: OriginAddress,
  bookings: Booking[],
  pickup?: PickupDetails,
) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        origin: {
          street: origin.street.trim(),
          city: origin.city.trim(),
          state: origin.state,
          zip: origin.zip,
        },
        ...(pickup ? { pickup } : {}),
        bookings: bookings
          .map((b) => ({
            date: b.date,
            period: b.period,
            vehicle: b.vehicle,
            count: b.count,
          }))
          .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      }),
    )
    .digest("hex");
}
export async function freightQuote(
  quote: StoredQuote,
  origin: OriginAddress,
  bookings: Booking[],
  snapshot: DeliverySnapshot,
  pickup?: PickupDetails,
) {
  if (pickup) {
    const cargo = cargoTotals(
      quote.lines,
      quote.pricing.rules,
      pickup,
      snapshot.settings.transport,
    );
    if (!capacityFits(cargo, bookings, snapshot.settings.transport))
      throw Error("load_exceeds_bookings");
  }
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw Error("freight_not_configured");
  if (calculateFreight(0, bookings, snapshot.settings) === null)
    throw Error("freight_not_configured");
  const address = `${origin.street}, ${origin.city}, ${origin.state} ${origin.zip}, USA`;
  const params = new URLSearchParams({
    address,
    components: "country:US|postal_code:" + origin.zip,
    key,
  });
  const geo = await fetch(
    "https://maps.googleapis.com/maps/api/geocode/json?" + params,
    { signal: AbortSignal.timeout(10000), cache: "no-store" },
  );
  if (!geo.ok) throw Error("distance_unavailable");
  const g = await geo.json();
  const location = g.results?.[0];
  if (
    g.status !== "OK" ||
    !location?.address_components?.some(
      (c: { types: string[]; short_name: string }) =>
        c.types.includes("country") && c.short_name === "US",
    )
  )
    throw Error("us_address_required");
  const lat = location.geometry?.location?.lat,
    lng = location.geometry?.location?.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    throw Error("distance_unavailable");
  const route = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: lat, longitude: lng } } },
        destination: { address: snapshot.settings.address },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
        computeAlternativeRoutes: false,
      }),
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    },
  );
  if (!route.ok) throw Error("distance_unavailable");
  const data = await route.json();
  const meters = data.routes?.[0]?.distanceMeters;
  if (!Number.isFinite(meters) || meters < 0)
    throw Error("distance_unavailable");
  const miles = Math.round((meters / 1609.344) * 1000) / 1000;
  const baseAmount = calculateFreight(miles, bookings, snapshot.settings);
  if (baseAmount === null) throw Error("freight_not_configured");
  const service = pickup
    ? pickupCharges(pickup, snapshot.settings.pickupFees)
    : { items: [], knownTotal: 0, pending: [] };
  if (pickup) {
    const cargo = cargoTotals(
      quote.lines,
      quote.pricing.rules,
      pickup,
      snapshot.settings.transport,
    );
    if (cargo.weightLb === null)
      service.pending.push("Shipment gross weight requires confirmation");
    if (cargo.pallets === null)
      service.pending.push("Pallet count and outside dimensions require confirmation");
    if (loadingNeedsReview(cargo, bookings, snapshot.settings.transport))
      service.pending.push(
        "Vehicle loading limits or shipment weight require confirmation",
      );
  }
  const amount = Math.round((baseAmount + service.knownTotal) * 100) / 100;
  const breakdown = {
    baseAmount,
    services: service.items,
    pending: service.pending,
    knownSubtotal: amount,
  };
  const id = crypto.randomUUID();
  const sql = database();
  await sql`INSERT INTO pv_freight_quotes(id,quotation_id,request_hash,settings_version,distance_miles,amount,expires_at,pickup_details,breakdown) VALUES(${id},${quote.recordId},${freightFingerprint(origin, bookings, pickup)},${snapshot.version},${miles},${amount},${quote.expiresAt},${pickup ? JSON.stringify(pickup) : null}::jsonb,${JSON.stringify(breakdown)}::jsonb)`;
  return {
    id,
    distanceMiles: miles,
    amount,
    breakdown,
    expiresAt: quote.expiresAt,
  };
}
