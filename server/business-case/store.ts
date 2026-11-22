import {database} from '../db/client';
import {seed,validateData,type BusinessCaseData} from './workbook';
export type Snapshot={version:string;number:number;createdAt:string;data:BusinessCaseData};
const snapshot=(r:Record<string,unknown>):Snapshot=>({version:String(r.id),number:Number(r.version),createdAt:new Date(String(r.created_at)).toISOString(),data:validateData(r.data)});
export async function activeData(){const sql=database();const [r]=await sql`SELECT v.* FROM pv_business_case_versions v JOIN pv_business_case_active a ON a.version_id=v.id WHERE a.singleton=true`;if(!r)throw Error('No published master');return snapshot(r);}
export async function history(){const sql=database();return (await sql`SELECT v.id,v.version,v.created_at,v.created_by,v.note,(v.id=a.version_id) AS active FROM pv_business_case_versions v CROSS JOIN pv_business_case_active a ORDER BY v.version DESC`).map(r=>({id:r.id,number:r.version,createdAt:new Date(r.created_at).toISOString(),actorEmail:r.created_by,note:r.note,active:r.active}));}
export async function version(id:string){const sql=database();const [r]=await sql`SELECT * FROM pv_business_case_versions WHERE id=${id}::uuid`;return r?snapshot(r):null;}
export async function save(data:BusinessCaseData,expected:string,email:string,note:string){data=validateData(data);const sql=database();const id=crypto.randomUUID();
 // Lock the singleton first. A waiting publisher rechecks expectedVersion after the lock.
 const rows=await sql`WITH locked AS (SELECT a.version_id,v.version FROM pv_business_case_active a JOIN pv_business_case_versions v ON v.id=a.version_id WHERE a.singleton=true FOR UPDATE OF a), inserted AS (INSERT INTO pv_business_case_versions(id,version,data,created_by,note) SELECT ${id},version+1,${JSON.stringify(data)}::jsonb,${email},${note} FROM locked WHERE version_id=${expected}::uuid RETURNING id) UPDATE pv_business_case_active SET version_id=(SELECT id FROM inserted) WHERE singleton=true AND EXISTS(SELECT 1 FROM inserted) RETURNING version_id`;
 return rows.length?activeData():null;
}
export async function dataOrSeed(){try{const s=await activeData();return {...s.data,source:`Published master v${s.number}`};}catch{return {...seed,source:'Built-in fallback'};}}
