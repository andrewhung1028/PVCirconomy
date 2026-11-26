import { adminAccess, trustedOrigin } from "../../../../../server/auth/microsoft";
import { reply } from "../../../../../server/delivery/http";
import { loadEquipmentSettings } from "../../../../../server/equipment-configurations/store";
import { exportEquipmentWorkbook, importEquipmentWorkbook } from "../../../../../server/equipment-configurations/workbook";

export const runtime = "nodejs";
const maxFileSize = 1_000_000;

export async function GET() {
  const denied = await adminAccess("equipment", "GET");
  if (denied) return denied;
  try {
    const settings = await loadEquipmentSettings();
    return new Response(await exportEquipmentWorkbook(settings), { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="PV-Circulator-Equipment-v${settings.revision}.xlsx"`,
      "Cache-Control": "no-store",
    } });
  } catch {
    return reply({ error: "export_unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  const denied = await adminAccess("equipment", "POST");
  if (denied) return denied;
  if (!trustedOrigin(request)) return reply({ error: "invalid_origin" }, 403);
  if (Number(request.headers.get("content-length")) > maxFileSize + 65_536) return reply({ error: "file_too_large" }, 413);
  let draft;
  try {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return reply({ error: "file_required" }, 400);
    if (file.size > maxFileSize) return reply({ error: "file_too_large" }, 413);
    if (!file.name.toLowerCase().endsWith(".xlsx")) return reply({ error: "xlsx_required" }, 415);
    draft = await importEquipmentWorkbook(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    return reply({ error: "invalid_workbook", details: error instanceof Error ? error.message : undefined }, 400);
  }
  try {
    const current = await loadEquipmentSettings();
    return draft.expectedRevision === current.revision
      ? reply({ ...draft, quantitative: draft.quantitative ?? current.quantitative })
      : reply({ error: "version_conflict" }, 409);
  } catch {
    return reply({ error: "settings_unavailable" }, 503);
  }
}
