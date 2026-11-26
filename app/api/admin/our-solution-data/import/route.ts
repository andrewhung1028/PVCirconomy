import {adminAccess} from "../../../../../server/auth/microsoft";
import { staffSession, trustedOrigin } from "../../../../../server/auth/microsoft";
import { activeSharedParameters, validateSharedParameters, activeOurSolutionParameterData, assertOurSolutionMarketRegion, ourSolutionMarket } from "../../../../../server/our-solution/store";
import { diffOurSolutionData, diffSharedParameters } from "../../../../../lib/our-solution-data";
import { parseOurSolutionWorkbook, parseSharedParametersWorkbook } from "../../../../../server/our-solution/workbook";

import { effectiveMetalPrices } from "../../../../../server/metal-prices/store";
import { parameter } from "../../../../../lib/our-solution/parameters";
import { resolveMarketTransport } from "../../../../../server/our-solution/transport";
import { model } from "../../../../../lib/our-solution/model";

export const runtime = "nodejs";
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {const denied=await adminAccess("our-solution-data","POST");if(denied)return denied;
  const query = new URL(request.url).searchParams;
  const shared = query.get("scope") === "shared";
  const market = ourSolutionMarket(query.get("market"));
  if (!shared && !market) return reply({ error: "unsupported_market" }, 400);
  if (!await staffSession()) return reply({ error: "unauthorized" }, 401);
  if (!trustedOrigin(request)) return reply({ error: "invalid_origin" }, 403);
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return reply({ error: "file_required" }, 400);
    if (file.size > 3_000_000) return reply({ error: "file_too_large" }, 413);
    if (!file.name.toLowerCase().endsWith(".xlsx")) return reply({ error: "xlsx_required" }, 415);
    const publishedShared = await activeSharedParameters();
    const buffer = Buffer.from(await file.arrayBuffer());
    if (shared) {
      const data = await parseSharedParametersWorkbook(buffer, publishedShared.data);
      if (!validateSharedParameters(data)) return reply({ error: "invalid_data", details: ["請確認容量年份及人口資料完整，且全球容量不低於各區域加總。"] }, 400);
      return reply({ market: "shared", data, diff: diffSharedParameters(publishedShared.data, data), expectedVersion: publishedShared.version, fileName: file.name });
    }
    if (!market) return reply({ error: "unsupported_market" }, 400);
    const active = await activeOurSolutionParameterData(market);
    const legacyTransport = active && await resolveMarketTransport(market, active.data.transport, parameter(active.data, 7, "Pallet footprint"));
    const base = active && (legacyTransport ? { ...active.data, transport: legacyTransport } : active.data);
    const data = await parseOurSolutionWorkbook(buffer, base ?? undefined, publishedShared.data);
    try { assertOurSolutionMarketRegion(market, data.scenario.region_code); }
    catch (error) { return reply({ error: "region_mismatch", details: [error instanceof Error ? error.message : "Scenario.region_code 與目標市場不符。"] }, 400); }
    const prices = await effectiveMetalPrices(data);
    const preview = model(data, prices);
    return reply({ market,data, preview, prices, diff: diffOurSolutionData(base ?? null, data, prices), expectedVersion: active?.version ?? null, fileName: file.name });
  } catch (error) {
    return reply({ error: "invalid_workbook", details: error instanceof Error ? [error.message] : ["無法讀取工作簿。"] }, 400);
  }
}
