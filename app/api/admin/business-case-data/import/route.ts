import {adminAccess} from "../../../../../server/auth/microsoft";
import { staffSession, trustedOrigin } from "../../../../../server/auth/microsoft";
import { activeData } from "@/server/business-case/store";
import { diffData } from "@/server/business-case/workbook";
import { parseWorkbook } from "@/server/business-case/workbook";

export const runtime = "nodejs";
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {const denied=await adminAccess("business-case-data","POST");if(denied)return denied;
  if (!await staffSession()) return reply({ error: "unauthorized" }, 401);
  if (!trustedOrigin(request)) return reply({ error: "invalid_origin" }, 403);
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return reply({ error: "file_required" }, 400);
    if (file.size > 3_000_000) return reply({ error: "file_too_large" }, 413);
    if (!file.name.toLowerCase().endsWith(".xlsx")) return reply({ error: "xlsx_required" }, 415);
    const data = await parseWorkbook(Buffer.from(await file.arrayBuffer()));
    let active;
    try { active = await activeData(); }
    catch { return reply({ error: "database_unavailable", details: ["Business Case database is unavailable or not configured. Please retry after database setup or service recovery."] }, 503); }
    return reply({ data, diff: diffData(active.data, data), expectedVersion: active.version, fileName: file.name });
  } catch (error) {
    return reply({ error: "invalid_workbook", details: error instanceof Error ? [error.message] : ["無法讀取工作簿。"] }, 400);
  }
}
