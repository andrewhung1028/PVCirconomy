import {adminAccess} from "../../../../../server/auth/microsoft";
import { staffSession } from "../../../../../server/auth/microsoft";
import { activeOurSolutionData, ourSolutionVersion } from "../../../../../server/our-solution/store";
import { createOurSolutionWorkbook } from "../../../../../server/our-solution/workbook";

import { effectiveMetalPrices } from "../../../../../server/metal-prices/store";

export const runtime = "nodejs";

export async function GET(request: Request) {const denied=await adminAccess("our-solution-data","GET");if(denied)return denied;
  if (!await staffSession()) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const url = new URL(request.url);
    const template = url.searchParams.get("template") === "1";
    const version = url.searchParams.get("version");
    const snapshot = version ? await ourSolutionVersion(version) : await activeOurSolutionData();
    if (!snapshot) return Response.json({ error: "version_not_found" }, { status: 404 });
    const buffer = await createOurSolutionWorkbook(snapshot.data, template, await effectiveMetalPrices(snapshot.data));
    const suffix = template ? "Template" : snapshot.createdAt.slice(0, 10);
    return new Response(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="PV-Circonomy-Our-Solution-USD-${suffix}.xlsx"`, "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "export_unavailable" }, { status: 503 }); }
}
