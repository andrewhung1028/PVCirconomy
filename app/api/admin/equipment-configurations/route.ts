import { adminAccess, staffSession, trustedOrigin } from "../../../../server/auth/microsoft";
import { jsonBody, reply } from "../../../../server/delivery/http";
import { loadEquipmentSettings, publishEquipmentSettings, validateEquipmentConfigurations } from "../../../../server/equipment-configurations/store";

import { validateEquipmentQuantitative } from "../../../../lib/equipment-quantitative";
import { validateEquipmentModulePrices } from "../../../../lib/equipment-module-pricing";

export const runtime = "nodejs";

export async function GET() {
  const denied = await adminAccess("equipment", "GET");
  if (denied) return denied;
  try { return reply(await loadEquipmentSettings()); }
  catch { return reply({ error: "settings_unavailable" }, 503); }
}

export async function POST(request: Request) {
  const denied = await adminAccess("equipment", "POST");
  if (denied) return denied;
  const staff = await staffSession();
  if (!staff) return reply({ error: "unauthorized" }, 401);
  if (!trustedOrigin(request)) return reply({ error: "invalid_origin" }, 403);
  let body;
  try { body = await jsonBody(request, 65536); }
  catch { return reply({ error: "invalid_request" }, 400); }
  const configurations = validateEquipmentConfigurations(body?.configurations);
  const modulePrices = validateEquipmentModulePrices(body?.modulePrices);
  const quantitative = validateEquipmentQuantitative(body?.quantitative);
  const version = body?.expectedRevision;
  if (!configurations || !modulePrices || !quantitative || !Number.isInteger(version) || version < 0 || version >= 2_147_483_647)
    return reply({ error: "invalid_configuration" }, 400);
  try {
    const saved = await publishEquipmentSettings(configurations, modulePrices, quantitative, version, staff.email);
    return saved ? reply(saved, 201) : reply({ error: "version_conflict" }, 409);
  } catch {
    return reply({ error: "settings_unavailable" }, 503);
  }
}
