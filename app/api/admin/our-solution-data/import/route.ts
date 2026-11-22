import { staffSession, trustedOrigin } from "../../../../../server/auth/microsoft";
import { activeOurSolutionData } from "../../../../../server/our-solution/store";
import { diffOurSolutionData } from "../../../../../lib/our-solution-data";
import { parseOurSolutionWorkbook } from "../../../../../server/our-solution/workbook";

export const runtime = "nodejs";
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!await staffSession()) return reply({ error: "unauthorized" }, 401);
  if (!trustedOrigin(request)) return reply({ error: "invalid_origin" }, 403);
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return reply({ error: "file_required" }, 400);
    if (file.size > 3_000_000) return reply({ error: "file_too_large" }, 413);
    if (!file.name.toLowerCase().endsWith(".xlsx")) return reply({ error: "xlsx_required" }, 415);
    const active = await activeOurSolutionData();
    const data = await parseOurSolutionWorkbook(Buffer.from(await file.arrayBuffer()), active.data);
    return reply({ data, diff: diffOurSolutionData(active.data, data), expectedVersion: active.version, fileName: file.name });
  } catch (error) {
    return reply({ error: "invalid_workbook", details: error instanceof Error ? [error.message] : ["無法讀取工作簿。"] }, 400);
  }
}
