import {adminAccess} from "../../../../server/auth/microsoft";
import { staffSession, trustedOrigin } from "../../../../server/auth/microsoft";
import { activeSharedParameters, ourSolutionSharedHistory, saveSharedParameters, validateSharedParameters, activeOurSolutionParameterData, assertOurSolutionMarketRegion, ourSolutionHistory, ourSolutionMarket, saveOurSolutionData } from "../../../../server/our-solution/store";
import { withSharedParameters, type SharedParameters } from "../../../../lib/our-solution/shared";
import { validateOurSolutionData } from "../../../../lib/our-solution-data";
import { isAdditionalParameterMarket } from "../../../../lib/our-solution/market";

import { effectiveMetalPrices } from "../../../../server/metal-prices/store";
import { model } from "../../../../lib/our-solution/model";

export const runtime = "nodejs";
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request:Request) {const denied=await adminAccess("our-solution-data","GET");if(denied)return denied;
  if (!await staffSession()) return reply({ error: "unauthorized" }, 401);
  const query = new URL(request.url).searchParams;
  const shared = query.get("scope") === "shared";
  const market = ourSolutionMarket(query.get("market"));
  if (!shared && !market) return reply({ error: "unsupported_market" }, 400);
  try {
    if (shared) return reply({ market: "shared", active: await activeSharedParameters(), history: await ourSolutionSharedHistory() });
    if (!market) return reply({ error: "unsupported_market" }, 400);
    const active = await activeOurSolutionParameterData(market);
    if (!active) return reply({ market, active: null, history: [] });
    const prices = await effectiveMetalPrices(active.data);
    return reply({ market,active, history: await ourSolutionHistory(market), preview:model(active.data, prices), prices });
  }
  catch { return reply({ error: "database_unavailable" }, 503); }
}

export async function POST(request: Request) {const denied=await adminAccess("our-solution-data","POST");if(denied)return denied;
  const query = new URL(request.url).searchParams;
  const shared = query.get("scope") === "shared";
  const market = ourSolutionMarket(query.get("market"));
  if (!shared && !market) return reply({ error: "unsupported_market" }, 400);
  const staff = await staffSession();
  if (!staff) return reply({ error: "unauthorized" }, 401);
  if (!trustedOrigin(request)) return reply({ error: "invalid_origin" }, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return reply({ error: "invalid_content_type" }, 415);
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 500_000) return reply({ error: "request_too_large" }, 413);
    body = JSON.parse(raw);
  } catch { return reply({ error: "invalid_json" }, 400); }
  if (!body || typeof body !== "object") return reply({ error: "invalid_request" }, 400);
  const payload = body as { data?: unknown; expectedVersion?: unknown; note?: unknown };
  const expectedVersion = payload.expectedVersion;
  const firstPublish = !shared && market !== null && isAdditionalParameterMarket(market) && expectedVersion === null;
  if ((!firstPublish && (typeof expectedVersion !== "string" || !/^[a-f\d-]{36}$/i.test(expectedVersion))) ||
    (payload.note !== undefined && (typeof payload.note !== "string" || payload.note.length > 500 || payload.note.includes("\0")))) {
    return reply({ error: "invalid_request" }, 400);
  }
  const note = typeof payload.note === "string" ? payload.note : "";
  try {
    if (shared) {
      if (!validateSharedParameters(payload.data)) return reply({ error: "invalid_data", details: ["全球共用資料格式或數值無效。"] }, 400);
      const saved = await saveSharedParameters(payload.data as SharedParameters, expectedVersion as string, staff, note);
      if (!saved) return reply({ error: "version_conflict" }, 409);
      return reply({ market: "shared", active: saved, history: await ourSolutionSharedHistory() }, 201);
    }
    if (!market || !payload.data || typeof payload.data !== "object" || !("assumptions" in payload.data)) return reply({ error: "invalid_data" }, 400);
    const data = withSharedParameters(payload.data as Parameters<typeof withSharedParameters>[0], (await activeSharedParameters()).data);
    const checked = validateOurSolutionData(data);
    if (!checked.valid) return reply({ error: "invalid_data", details: checked.errors }, 400);
    try { assertOurSolutionMarketRegion(market, checked.data.scenario.region_code); }
    catch (error) { return reply({ error: "region_mismatch", details: [error instanceof Error ? error.message : "Scenario.region_code 與目標市場不符。"] }, 400); }
    const saved = await saveOurSolutionData(checked.data, firstPublish ? null : expectedVersion as string, staff, note, market);
    if (!saved) return reply({ error: "version_conflict" }, 409);
    const prices = await effectiveMetalPrices(saved.data);
    return reply({ market, active: saved, history: await ourSolutionHistory(market), preview: model(saved.data, prices), prices }, 201);
  } catch { return reply({ error: "database_unavailable" }, 503); }
}
