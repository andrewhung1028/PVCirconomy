import {adminAccess} from "../../../../server/auth/microsoft";
import { staffSession, trustedOrigin } from "../../../../server/auth/microsoft";
import { activeOurSolutionData, assertOurSolutionMarketRegion, ourSolutionHistory, ourSolutionMarket, saveOurSolutionData } from "../../../../server/our-solution/store";
import { validateOurSolutionData } from "../../../../lib/our-solution-data";

import { effectiveMetalPrices } from "../../../../server/metal-prices/store";
import { model } from "../../../../lib/our-solution/model";

export const runtime = "nodejs";
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request:Request) {const denied=await adminAccess("our-solution-data","GET");if(denied)return denied;
  if (!await staffSession()) return reply({ error: "unauthorized" }, 401);
  const market=ourSolutionMarket(new URL(request.url).searchParams.get("market"));
  try { const active = await activeOurSolutionData(market); const prices = await effectiveMetalPrices(active.data); return reply({ market,active, history: await ourSolutionHistory(market), preview:model(active.data, prices), prices }); }
  catch { return reply({ error: "database_unavailable" }, 503); }
}

export async function POST(request: Request) {const denied=await adminAccess("our-solution-data","POST");if(denied)return denied;
  const market=ourSolutionMarket(new URL(request.url).searchParams.get("market"));
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
  const payload = body as { data?: unknown; expectedVersion?: unknown; note?: unknown };
  const checked = validateOurSolutionData(payload.data);
  if (!checked.valid) return reply({ error: "invalid_data", details: checked.errors }, 400);
  try { assertOurSolutionMarketRegion(market, checked.data.scenario.region_code); }
  catch (error) { return reply({ error: "region_mismatch", details: [error instanceof Error ? error.message : "Scenario.region_code 與目標市場不符。"] }, 400); }
  if (typeof payload.expectedVersion !== "string" || !/^[a-f\d-]{36}$/i.test(payload.expectedVersion) || (payload.note !== undefined && (typeof payload.note !== "string" || payload.note.length > 500 || payload.note.includes("\0")))) return reply({ error: "invalid_request" }, 400);
  try {
    const saved = await saveOurSolutionData(checked.data, payload.expectedVersion, staff, typeof payload.note === "string" ? payload.note : "",market);
    if (!saved) return reply({ error: "version_conflict" }, 409);
    const prices = await effectiveMetalPrices(saved.data);
    return reply({ market,active: saved, history: await ourSolutionHistory(market), preview: model(saved.data, prices), prices }, 201);
  } catch { return reply({ error: "database_unavailable" }, 503); }
}
