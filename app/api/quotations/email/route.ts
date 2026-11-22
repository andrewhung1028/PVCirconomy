import { database } from "../../../../server/db/client";
import { validUuid, readQuotation } from "../../../../server/delivery/quotations";
import { jsonBody, reply, sameOrigin } from "../../../../server/delivery/http";
import { limit } from "../../../../server/delivery/limits";
import { sendQuotation, mailConfigured } from "../../../../server/delivery/communications";
import {
  quotationEmail,
  type OrderEmailDetails,
  type PickupEmailDetails,
} from "../../../../lib/quotation-email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "invalid_origin" }, 403);
  try {
    if (!mailConfigured()) return reply({ error: "mail_not_configured" }, 503);
    if (!(await limit(request, "quotation-email", 3, 3600)))
      return reply({ error: "too_many_requests" }, 429);
    const body = await jsonBody(request, 4096);
    const quote = await readQuotation(body.quotationId, body.accessToken);
    if (!quote) return reply({ error: "invalid_quotation" }, 401);
    if (
      typeof body.email !== "string" ||
      body.email.length > 254 ||
      /[\r\n]/.test(body.email) ||
      !quote.document.text.split("\n").includes("Email: " + body.email)
    )
      return reply({ error: "invalid_recipient" }, 400);

    let mailKey = quote.recordId;
    let order: OrderEmailDetails | null = null;
    let pickup: PickupEmailDetails | null = null;
    const sql = database();

    if (body.orderId) {
      if (!validUuid(body.orderId)) return reply({ error: "invalid_order" }, 400);
      const [row] = await sql`
        SELECT id, delivery_method, bookings, freight_total, freight_breakdown,
               contact, origin_address
        FROM pv_recycling_order_requests
        WHERE id=${body.orderId}::uuid AND quotation_id=${quote.recordId}::uuid
      `;
      if (!row) return reply({ error: "invalid_order" }, 400);
      mailKey = row.id;
      order = {
        id: row.id,
        deliveryMethod: row.delivery_method,
        bookings: row.bookings,
        freightTotal: row.freight_total === null ? null : Number(row.freight_total),
        freightBreakdown: row.freight_breakdown,
        contact: row.contact,
        originAddress: row.origin_address,
      };
    } else if (body.freightQuoteId) {
      if (!validUuid(body.freightQuoteId))
        return reply({ error: "invalid_freight_quote" }, 400);
      const [row] = await sql`
        SELECT id, distance_miles, breakdown
        FROM pv_freight_quotes
        WHERE id=${body.freightQuoteId}::uuid
          AND quotation_id=${quote.recordId}::uuid
          AND expires_at>now()
      `;
      if (!row?.breakdown) return reply({ error: "invalid_freight_quote" }, 400);
      mailKey = row.id;
      pickup = {
        id: row.id,
        distanceMiles: Number(row.distance_miles),
        breakdown: row.breakdown,
      };
    }

    const message = quotationEmail({
      document: quote.document,
      lines: quote.lines,
      pricing: quote.pricing,
      processingTotal: quote.processingTotal,
      recipient: body.email,
      order,
      pickup,
    });
    await sendQuotation(mailKey, body.email, message);
    return reply({ ok: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    return reply(
      { error: reason === "send_in_progress" ? reason : "mail_unavailable" },
      reason === "send_in_progress" ? 409 : 503,
    );
  }
}
