import {calculationInput} from '@/lib/business-case/input';
import {database} from '@/server/db/client';
import {loadMasterData} from '@/lib/business-case/master-data';
import {calculateBusinessCase} from '@/lib/business-case/calculator/engine';
import {sendBusinessCaseEmail} from '@/lib/business-case/business-case-email';
import {resolveReportTimeZone,reportDate} from '@/lib/business-case/report-time';
export const runtime='nodejs';
export async function POST(request:Request){
 let b: Record<string, any>;try{const raw=await request.text();if(raw.length>100000)return Response.json({error:'request_too_large'},{status:413});b=JSON.parse(raw);if(typeof b.name!=='string'||!b.name.trim()||b.name.length>200||typeof b.email!=='string'||b.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)||['company','customerCountry','intent'].some(k=>b[k]!==undefined&&(typeof b[k]!=='string'||b[k].length>500)))throw Error();}catch{return Response.json({error:'Please provide a valid name and email address'},{status:400});}
 let result;try{const data=await loadMasterData(b.result?.input?.regionCode);const input=calculationInput(b.result?.input,data);result=calculateBusinessCase(data,input);}catch{return Response.json({error:'Invalid calculation'},{status:400});}
 const id=crypto.randomUUID(),now=new Date(),zone=resolveReportTimeZone(b.timeZone),reference=`BC-${reportDate(now,zone).replaceAll('-','')}-${id.slice(-8).toUpperCase()}`;
 try{const sql=database();await sql`INSERT INTO pv_business_case_followups(id,reference,submission) VALUES(${id},${reference},${JSON.stringify({name:b.name,email:b.email,company:b.company??'',customerCountry:b.customerCountry??'',intent:b.intent??'Email Summary',result,timeZone:zone})}::jsonb)`;
 const delivery=await sendBusinessCaseEmail(b.email,b.name,reference,result,zone,now);await sql`UPDATE pv_business_case_followups SET email_status=${delivery.status} WHERE id=${id}::uuid`;
 return Response.json({success:true,calculationId:reference,emailStatus:delivery.status,emailErrorCode:delivery.errorCode});
 }catch{return Response.json({error:'Unable to save follow-up'},{status:503});}
}
