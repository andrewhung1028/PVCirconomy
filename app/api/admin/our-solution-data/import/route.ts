import {adminAccess} from "../../../../../server/auth/microsoft";
import { staffSession, trustedOrigin } from "../../../../../server/auth/microsoft";
import { activeOurSolutionData, ourSolutionMarket } from "../../../../../server/our-solution/store";
import { diffOurSolutionData } from "../../../../../lib/our-solution-data";
import { parseOurSolutionWorkbook } from "../../../../../server/our-solution/workbook";

import { effectiveMetalPrices } from "../../../../../server/metal-prices/store";
import { model } from "../../../../../lib/our-solution/model";

export const runtime = "nodejs";
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {const denied=await adminAccess("our-solution-data","POST");if(denied)return denied;
  const market=ourSolutionMarket(new URL(request.url).searchParams.get("market"));
  if (!await staffSession()) return reply({ error: "unauthorized" }, 401);
  if (!trustedOrigin(request)) return reply({ error: "invalid_origin" }, 403);
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return reply({ error: "file_required" }, 400);
    if (file.size > 3_000_000) return reply({ error: "file_too_large" }, 413);
    if (!file.name.toLowerCase().endsWith(".xlsx")) return reply({ error: "xlsx_required" }, 415);
    const active = await activeOurSolutionData(market);
    const data = await parseOurSolutionWorkbook(Buffer.from(await file.arrayBuffer()), active.data);
    const prices = await effectiveMetalPrices(data);
    const preview = model(data, prices);
    return reply({ market,data, preview, prices, diff: diffOurSolutionData(active.data, data, prices), expectedVersion: active.version, fileName: file.name });
  } catch (error) {
    return reply({ error: "invalid_workbook", details: error instanceof Error ? [error.message] : ["無法讀取工作簿。"] }, 400);
  }
}
