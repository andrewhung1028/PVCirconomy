import {adminAccess} from '@/server/auth/microsoft';
import {activeData,version} from '@/server/business-case/store';
import {exportWorkbook,seed} from '@/server/business-case/workbook';
export const runtime='nodejs';
export async function GET(request:Request){const denied=await adminAccess('business-case-data','GET');if(denied)return denied;const q=new URL(request.url).searchParams;try{const id=q.get('version');if(id&&!/^[a-f\d-]{36}$/i.test(id))return Response.json({error:'invalid_version'},{status:400});const data=q.has('template')?seed:id?(await version(id))?.data:(await activeData()).data;if(!data)return Response.json({error:'not_found'},{status:404});return new Response(new Uint8Array(await exportWorkbook(data)),{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="Business-Case-Master.xlsx"','Cache-Control':'no-store'}});}catch{return Response.json({error:'database_unavailable'},{status:503});}}
