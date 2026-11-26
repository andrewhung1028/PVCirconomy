import {adminAccess} from "../../../../../server/auth/microsoft";
import { staffSession } from "../../../../../server/auth/microsoft";
import { activeSharedParameters, ourSolutionSharedVersion, activeOurSolutionParameterData, ourSolutionMarket, ourSolutionVersion } from "../../../../../server/our-solution/store";
import { createSharedParametersWorkbook, createInitialOurSolutionTemplate, createOurSolutionWorkbook } from "../../../../../server/our-solution/workbook";
import { isAdditionalParameterMarket } from "../../../../../lib/our-solution/market";

import { parameter } from "../../../../../lib/our-solution/parameters";
import { resolveMarketTransport } from "../../../../../server/our-solution/transport";
import { effectiveMetalPrices } from "../../../../../server/metal-prices/store";

export const runtime = "nodejs";

export async function GET(request: Request) {const denied=await adminAccess("our-solution-data","GET");if(denied)return denied;
  if (!await staffSession()) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const url = new URL(request.url);
    const version = url.searchParams.get("version");
    if (url.searchParams.get("scope") === "shared") {
      const snapshot = version ? await ourSolutionSharedVersion(version) : await activeSharedParameters();
      if (!snapshot) return Response.json({ error: "version_not_found" }, { status: 404 });
      return workbookResponse(await createSharedParametersWorkbook(snapshot.data), `Shared-${snapshot.createdAt.slice(0, 10)}`);
    }
    const market = ourSolutionMarket(url.searchParams.get("market"));
    if (!market) return Response.json({ error: "unsupported_market" }, { status: 400 });
    const template = url.searchParams.get("template") === "1";
    const snapshot = version ? await ourSolutionVersion(version,market) : await activeOurSolutionParameterData(market);
    let buffer: Buffer<ArrayBuffer>;
    if (snapshot) {
      const { data } = snapshot;
      const transport = version ? data.transport : await resolveMarketTransport(market, data.transport, parameter(data, 7, "Pallet footprint"));
      const [prices, shared] = await Promise.all([effectiveMetalPrices(data), activeSharedParameters()]);
      buffer = await createOurSolutionWorkbook({ ...data, transport }, template, prices, false, true, shared.data);
    } else if (template && !version && isAdditionalParameterMarket(market)) {
      buffer = await createInitialOurSolutionTemplate(market, (await activeSharedParameters()).data);
    }
    else return Response.json({ error: "version_not_found" }, { status: 404 });
    const suffix = template ? "Template" : snapshot?.createdAt.slice(0, 10);
    return workbookResponse(buffer, `${market}-${suffix}`);
  } catch { return Response.json({ error: "export_unavailable" }, { status: 503 }); }
}

function workbookResponse(buffer: Buffer<ArrayBuffer>, suffix: string) {
  return new Response(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="PV-Circonomy-Our-Solution-${suffix}.xlsx"`, "Cache-Control": "no-store" } });
}
