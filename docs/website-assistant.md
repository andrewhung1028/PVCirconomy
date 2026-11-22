# Recycling help assistant

Quiet floating Recycling help button, optional non-modal panel, Escape closes and returns focus. Does not auto-open or duplicate the estimate CTA.

Without both server-only `OPENAI_API_KEY` and `OPENAI_MODEL`, the panel explicitly shows Website guide / AI not connected and uses local knowledge-navigation replies. Photos are not sent. No contact/order tools exist.

To enable AI later, configure both values in the relevant Vercel environment and redeploy. Never use NEXT_PUBLIC variables. `GET /api/assistant/` reports capability only; `POST` calls OpenAI Responses API with store:false, short replies and bounded history/body size. Model must be available to the account. No key has been supplied and no live model call has been validated.

The route rejects cross-origin browser requests, validates messages and limits requests per Vercel instance (8/minute/client). This in-memory limiter is not a distributed spend guarantee; use platform/WAF or shared rate limits plus provider budget controls before public AI activation. Same-origin validation is not authentication. Status true means configuration present, not provider health. Provider failure explicitly falls back to labeled website guide replies. Questions sent to AI are disclosed in the panel; no server transcript logging is implemented.

The prompt confines replies to site scope, avoids unsupported regulatory/performance claims, personalized price calculations and transaction confirmations. The browser does not execute assistant-generated HTML or markdown. Grounding is prompt-based and cannot guarantee factual correctness; formal quote/acceptance is handled by business workflow, not AI.

The earlier `server/assistant-handler.mjs` is the legacy owner-private adapter, not this public route.
