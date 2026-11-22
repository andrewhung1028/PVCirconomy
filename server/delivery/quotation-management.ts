import {database} from '../db/client';
import {initializeDelivery} from './store';

export async function listStandaloneQuotations({query='',status='all',page=1}:{query?:string;status?:string;page?:number}={}){
 await initializeDelivery();const sql=database();const offset=(page-1)*25;
 const [quotations,count]=await Promise.all([
  sql`SELECT q.id,q.document,q.lines,q.pricing_snapshot,q.processing_total,q.created_at,q.expires_at FROM pv_recycling_quotations q WHERE NOT EXISTS (SELECT 1 FROM pv_recycling_order_requests o WHERE o.quotation_id=q.id) AND (${status}='all' OR (${status}='valid' AND q.expires_at>=now()) OR (${status}='expired' AND q.expires_at<now())) AND (${query}='' OR strpos(lower(concat_ws(' ',q.id::text,q.document->>'id',q.document->>'text')),lower(${query}))>0) ORDER BY q.created_at DESC,q.id LIMIT 25 OFFSET ${offset}`,
  sql`SELECT count(*)::integer AS total FROM pv_recycling_quotations q WHERE NOT EXISTS (SELECT 1 FROM pv_recycling_order_requests o WHERE o.quotation_id=q.id) AND (${status}='all' OR (${status}='valid' AND q.expires_at>=now()) OR (${status}='expired' AND q.expires_at<now())) AND (${query}='' OR strpos(lower(concat_ws(' ',q.id::text,q.document->>'id',q.document->>'text')),lower(${query}))>0)`
 ]);return {quotations,total:count[0].total,page,pageSize:25};
}
