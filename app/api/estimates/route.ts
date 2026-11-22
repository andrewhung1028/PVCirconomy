import {activePricing} from '../../../server/pricing/store';
import { database } from '../../../server/db/client';
import { recyclingQuote, type QuoteInput } from '../../../lib/recycling-quote';
export const runtime = 'nodejs';
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  let origin: URL;
  try { origin = new URL(request.headers.get('origin') || ''); } catch { return reply({ error: 'invalid_origin' }, 403); }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.host !== request.headers.get('host')) return reply({ error: 'invalid_origin' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return reply({ error: 'invalid_content_type' }, 415);
  if (!process.env.DATABASE_URL) return reply({ error: 'database_unavailable' }, 503);
  let body;
  try {
    const reader = request.body?.getReader(); if (!reader) return reply({ error: 'invalid_body' }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const item = await reader.read(); if (item.done) break; size += item.value.length; if (size > 4096) { await reader.cancel(); return reply({ error: 'request_too_large' }, 413); } chunks.push(item.value); }
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return reply({ error: 'invalid_json' }, 400); }
  if (!body || typeof body !== 'object' || !Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 1000000 || !Number.isInteger(body.watts) || body.watts < 1 || body.watts > 2000 || !['truck','trailer'].includes(body.scale) || !['complete','broken','missing-box','missing-frame','missing-both'].includes(body.condition) || !['dropoff','pickup'].includes(body.delivery) || typeof body.zip !== 'string' || !/^\d{5}$/.test(body.zip) || typeof body.model !== 'string' || body.model.length > 160) return reply({ error: 'invalid_fields' }, 400);
  try {
    const pricing=await activePricing();
    const quote = recyclingQuote({quantity:body.quantity,watts:body.watts,scale:body.scale,condition:body.condition} as QuoteInput,pricing.rules,pricing.transport);
    const sql = database(); const id = crypto.randomUUID();
    await sql`INSERT INTO pv_estimates (id,panel_count,rated_watts,model_description,shipment_scale,panel_condition,delivery_method,us_zip,processing_estimate_usd,pricing_version,status) VALUES (${id},${body.quantity},${body.watts},${body.model},${body.scale},${body.condition},${body.delivery},${body.zip},${quote.total},${pricing.version},${quote.total === null ? 'rate-review' : 'estimate'})`;
    return reply({ id, processingEstimate: quote.total, status: quote.total === null ? 'rate-review' : 'estimate' }, 201);
  } catch { return reply({ error: 'database_unavailable' }, 503); }
}
