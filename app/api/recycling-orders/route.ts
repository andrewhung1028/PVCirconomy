import { validPickup, capacityFits, pickupCharges } from "../../../lib/pickup";
import { cargoTotals } from "../../../lib/pickup-cargo";
import { createHash } from "node:crypto";
import { database } from "../../../server/db/client";
import { readQuotation, validUuid } from "../../../server/delivery/quotations";
import { deliverySettings } from "../../../server/delivery/store";
import {
  validBookings,
  validOrigin,
  calculateFreight,
} from "../../../lib/delivery";
import { freightFingerprint } from "../../../server/delivery/freight";
import { jsonBody, reply, sameOrigin } from "../../../server/delivery/http";
import { limit } from "../../../server/delivery/limits";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "invalid_origin" }, 403);
  try {
    const b = await jsonBody(request, 65536);
    if (
      !validUuid(b.idempotencyKey) ||
      !["self", "pickup"].includes(b.method) ||
      b.acceptedTerms !== true
    )
      return reply({ error: "invalid_order" }, 400);
    const c = b.contact;
    if (
      !c ||
      typeof c.name !== "string" ||
      c.name.trim().length < 2 ||
      c.name.length > 120 ||
      typeof c.email !== "string" ||
      c.email.length > 254 ||
      !/^\S+@\S+\.\S+$/.test(c.email) ||
      typeof c.phone !== "string" ||
      c.phone.trim().length < 7 ||
      c.phone.length > 40 ||
      typeof c.company !== "string" ||
      c.company.length > 160
    )
      return reply({ error: "invalid_contact" }, 400);
    const quote = await readQuotation(b.quotationId, b.accessToken);
    if (!quote) return reply({ error: "quotation_expired_or_invalid" }, 401);
    const snapshot = await deliverySettings();
    if (
      !validBookings(b.bookings, snapshot.settings) ||
      (b.method === "pickup" && !validOrigin(b.origin))
    )
      return reply({ error: "invalid_delivery_details" }, 400);
    if (b.method === "pickup") {
      if (!validPickup(b.pickup))
        return reply({ error: "invalid_pickup_details" }, 400);
      const cargo = cargoTotals(
        quote.lines,
        quote.pricing.rules,
        b.pickup,
        snapshot.settings.transport,
      );
      if (!capacityFits(cargo, b.bookings, snapshot.settings.transport))
        return reply({ error: "load_exceeds_bookings" }, 400);
    }
    const contact = {
      name: c.name.trim(),
      email: c.email.trim(),
      phone: c.phone.trim(),
      company: c.company.trim(),
    };
    const bookings = b.bookings;
    const hash = createHash("sha256")
      .update(
        JSON.stringify({
          quotationId: quote.recordId,
          contact,
          bookings,
          method: b.method,
          origin: b.method === "pickup" ? b.origin : null,
          freightQuoteId: b.freightQuoteId ?? null,
          ...(b.method === "pickup" ? { pickup: b.pickup } : {}),
        }),
      )
      .digest("hex");
    const sql = database();
    const [existing] =
      await sql`SELECT id,request_hash,status FROM pv_recycling_order_requests WHERE idempotency_key=${b.idempotencyKey}::uuid`;
    if (existing)
      return existing.request_hash === hash
        ? reply({ id: existing.id, status: existing.status })
        : reply({ error: "idempotency_conflict" }, 409);
    const [prior] =
      await sql`SELECT id,status,request_hash FROM pv_recycling_order_requests WHERE quotation_id=${quote.recordId}::uuid AND status IN('pending','confirmed')`;
    if (prior)
      return prior.request_hash === hash
        ? reply({ id: prior.id, status: prior.status })
        : reply({ error: "quote_already_has_order", id: prior.id }, 409);
    if (!(await limit(request, "order", 20, 3600)))
      return reply({ error: "too_many_requests" }, 429);
    let freight: number | null = b.method === "self" ? 0 : null;
    let freightId: string | null = null;
    const requestedServices =
      b.method === "pickup"
        ? pickupCharges(b.pickup, snapshot.settings.pickupFees)
        : null;
    let freightBreakdown: unknown = requestedServices
      ? {
          baseAmount: null,
          services: requestedServices.items,
          pending: [
            "Base pickup transportation requires pricing",
            ...requestedServices.pending,
          ],
          knownSubtotal: requestedServices.knownTotal,
        }
      : null;
    if (b.method === "pickup" && b.freightQuoteId) {
      if (!validUuid(b.freightQuoteId))
        return reply({ error: "invalid_freight_quote" }, 400);
      const [f] =
        await sql`SELECT * FROM pv_freight_quotes WHERE id=${b.freightQuoteId}::uuid AND quotation_id=${quote.recordId}::uuid AND expires_at>now()`;
      if (
        !f ||
        f.request_hash !== freightFingerprint(b.origin, bookings, b.pickup) ||
        f.settings_version !== snapshot.version
      )
        return reply({ error: "freight_quote_changed_or_expired" }, 409);
      freight = f.breakdown?.pending?.length ? null : Number(f.amount);
      freightBreakdown = f.breakdown;
      freightId = f.id;
    } else if (
      b.method === "pickup" &&
      process.env.GOOGLE_MAPS_API_KEY &&
      calculateFreight(0, bookings, snapshot.settings) !== null
    )
      return reply({ error: "freight_quote_required" }, 400);
    const id = crypto.randomUUID();
    const config = snapshot.settings;
    const result = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(1842741023)`,
      sql`WITH requested AS(SELECT x.date,x.period,COALESCE(SUM(x.count) FILTER(WHERE x.vehicle='truck'),0) AS trucks,COALESCE(SUM(x.count) FILTER(WHERE x.vehicle='trailer'),0) AS trailers FROM jsonb_to_recordset(${JSON.stringify(bookings)}::jsonb) AS x(date text,period text,vehicle text,count integer) GROUP BY x.date,x.period),used AS(SELECT b->>'date' AS date,b->>'period' AS period,COALESCE(SUM((b->>'count')::integer) FILTER(WHERE b->>'vehicle'='truck'),0) AS trucks,COALESCE(SUM((b->>'count')::integer) FILTER(WHERE b->>'vehicle'='trailer'),0) AS trailers FROM pv_recycling_order_requests o CROSS JOIN LATERAL jsonb_array_elements(o.bookings) b WHERE o.status IN('pending','confirmed') AND o.delivery_method=${b.method} GROUP BY b->>'date',b->>'period'),available AS(SELECT bool_and((r.trucks+COALESCE(u.trucks,0))*${config.trailerCapacity}::integer+(r.trailers+COALESCE(u.trailers,0))*${config.truckCapacity}::integer<=${config.truckCapacity}::integer*${config.trailerCapacity}::integer) AS ok FROM requested r LEFT JOIN used u ON u.date=r.date AND u.period=r.period) INSERT INTO pv_recycling_order_requests(id,idempotency_key,request_hash,quotation_id,delivery_method,bookings,origin_address,contact,processing_total,freight_total,freight_quote_id,pickup_details,freight_breakdown) SELECT ${id},${b.idempotencyKey}::uuid,${hash},${quote.recordId}::uuid,${b.method},${JSON.stringify(bookings)}::jsonb,${b.method === "pickup" ? JSON.stringify(b.origin) : null}::jsonb,${JSON.stringify(contact)}::jsonb,${quote.processingTotal},${freight},${freightId}::uuid,${b.method === "pickup" ? JSON.stringify(b.pickup) : null}::jsonb,${freightBreakdown ? JSON.stringify(freightBreakdown) : null}::jsonb WHERE (SELECT ok FROM available) AND NOT EXISTS(SELECT 1 FROM pv_recycling_order_requests WHERE quotation_id=${quote.recordId}::uuid AND status IN('pending','confirmed')) AND EXISTS(SELECT 1 FROM pv_delivery_settings WHERE singleton=true AND version=${snapshot.version}::uuid) AND EXISTS(SELECT 1 FROM pv_recycling_quotations WHERE id=${quote.recordId}::uuid AND expires_at>now()) ON CONFLICT(idempotency_key) DO NOTHING RETURNING id,status`,
    ]);
    const rows = result[1];
    if (!rows.length) {
      const [duplicate] =
        await sql`SELECT id,status,request_hash FROM pv_recycling_order_requests WHERE idempotency_key=${b.idempotencyKey}::uuid`;
      if (duplicate && duplicate.request_hash === hash)
        return reply({ id: duplicate.id, status: duplicate.status });
      const [prior] =
        await sql`SELECT id,status,request_hash FROM pv_recycling_order_requests WHERE quotation_id=${quote.recordId}::uuid AND status IN('pending','confirmed')`;
      if (prior)
        return prior.request_hash === hash
          ? reply({ id: prior.id, status: prior.status })
          : reply({ error: "quote_already_has_order", id: prior.id }, 409);
      return reply({ error: "slot_or_settings_changed" }, 409);
    }
    return reply(
      {
        id,
        status: "pending",
        message:
          "Request received. Your selected time windows are held pending company confirmation.",
      },
      201,
    );
  } catch {
    return reply({ error: "order_unavailable" }, 503);
  }
}
