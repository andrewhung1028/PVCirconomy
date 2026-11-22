import {adminAccess,staffSession,trustedOrigin} from '@/server/auth/microsoft';
import {activeData,history,save,version} from '@/server/business-case/store';
import {validateData} from '@/server/business-case/workbook';
export const runtime='nodejs';
export async function GET(){const denied=await adminAccess('business-case-data','GET');if(denied)return denied;try{return Response.json({active:await activeData(),history:await history()},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'database_unavailable'},{status:503});}}
export async function POST(request:Request){const denied=await adminAccess('business-case-data','POST');if(denied)return denied;if(!trustedOrigin(request))return Response.json({error:'invalid_origin'},{status:403});
 try {const raw=await request.text();if(raw.length>500000)return Response.json({error:'request_too_large'},{status:413});const b=JSON.parse(raw);if(typeof b.expectedVersion!=='string'||!/^[a-f\d-]{36}$/i.test(b.expectedVersion)||typeof (b.note??'')!=='string'||(b.note??'').length>500)throw Error('Invalid request');
 let data;try{data=b.restoreVersion? (await version(b.restoreVersion))?.data:validateData(b.data);if(!data)throw Error('Version not found');}catch{return Response.json({error:'invalid_data'},{status:400});}
 const result=await save(data,b.expectedVersion,(await staffSession())!.email,b.note??'');if(!result)return Response.json({error:'version_conflict'},{status:409});return Response.json({active:result,history:await history()},{status:201});
 }catch{return Response.json({error:'publish_failed'},{status:400});}}
