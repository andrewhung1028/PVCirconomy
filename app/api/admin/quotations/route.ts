import {staffSession} from '../../../../server/auth/microsoft';
import {listStandaloneQuotations} from '../../../../server/delivery/quotation-management';
import {reply} from '../../../../server/delivery/http';
export const runtime='nodejs';
export async function GET(request:Request){if(!await staffSession())return reply({error:'unauthorized'},401);const p=new URL(request.url).searchParams;const query=p.get('q')?.trim()||'',status=p.get('status')||'all',page=Number(p.get('page')||1);if(query.length>160||!['all','valid','expired'].includes(status)||!Number.isInteger(page)||page<1||page>100000)return reply({error:'invalid_filters'},400);try{return reply(await listStandaloneQuotations({query,status,page}))}catch{return reply({error:'quotations_unavailable'},503)}}
