/* Server-only adapter for a future authenticated /api/assistant deployment.
 * The current static preview does not execute or expose this module.
 */
const instructions = `You are PV Circonomy's website assistant. Reply in the visitor's language, concisely. Use only the following verified website scope. Help visitors choose recycling services, PV Circulator equipment or circular materials. Do not invent certifications, service geography, stock, purity, recovery rates or performance claims. Recycling estimate preview uses illustrative volume rates and a reference local pickup scenario; direct visitors to the current estimate for scenario pricing, never promise a binding quote. Transport outside California requires manual review. Project Support is considered only above 1 MW, subject to feasibility. Bookings and RFQs in the preview are not submitted. Business case calculations are indicative scenarios, not guaranteed returns. Glass, aluminum, copper and recovered cell materials require batch-specific specifications and availability. EPR documentation depends on market and project scope; do not give legal guarantees. Suggested paths: /shop?type=recycling, /solutions#circulator, /business-case, /circular-products, /shop?type=materials, /shop?type=equipment. Never claim an order was placed, a slot reserved or an email sent. Decline unrelated requests and guide back to these services.`;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
export async function handleAssistant(request, env, fetcher = fetch) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  // Sites injects authenticated identity. This module is intended for the owner-private preview.
  // Before public launch, replace this boundary with an approved public rate-limit policy.
  if (!request.headers.get('oai-authenticated-user-id')) return json({ error: 'unauthorized' }, 401);
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'invalid_origin' }, 403);
  if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL) return json({ error: 'not_configured' }, 503);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 20000) return json({ error: 'request_too_large' }, 413);
    body = JSON.parse(raw);
  } catch { return json({ error: 'invalid_json' }, 400); }
  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 16 || body.messages.some(m => !m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 1000) || body.messages.at(-1).role !== 'user') return json({ error: 'invalid_messages' }, 400);
  try {
    const response = await fetcher('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: env.OPENAI_MODEL, instructions, input: body.messages.map(m => ({ role: m.role, content: m.content })), max_output_tokens: 500, store: false }),
      signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) return json({ error: 'assistant_unavailable' }, 502);
    const result = await response.json();
    const text = (result.output || []).filter(item => item.type === 'message').flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('\n');
    return text ? json({ text }) : json({ error: 'empty_response' }, 502);
  } catch { return json({ error: 'assistant_unavailable' }, 502); }
}
