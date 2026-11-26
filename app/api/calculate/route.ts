import {loadMasterData} from '@/lib/business-case/master-data';
import {calculateBusinessCase} from '@/lib/business-case/calculator/engine';
import {calculationInput} from '@/lib/business-case/input';
export const runtime='nodejs';
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 10000) return Response.json({ error: 'request_too_large' }, { status: 413 });
    const body = JSON.parse(raw);
    const data = await loadMasterData(body?.regionCode);
    const input = calculationInput(body, data);
    return Response.json({ source: data.source, result: calculateBusinessCase(data, input) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Invalid or unavailable calculation inputs' }, { status: 400 });
  }
}
