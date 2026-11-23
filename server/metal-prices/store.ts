import { database } from '../db/client';
import { applyStoredPrices, workbookPrices, type PriceRow, type PriceStore } from './service';
import type { Parameters } from '../../lib/our-solution/parameters';
let initializing:Promise<void>|null=null;
async function initialize(){if(!initializing)initializing=(async()=>{const sql=database();await sql.transaction([
  sql`SELECT pg_advisory_xact_lock(1842741038)`,
  sql`CREATE TABLE IF NOT EXISTS pv_metal_prices(id uuid PRIMARY KEY, metal text NOT NULL, price double precision NOT NULL, unit text NOT NULL, source text NOT NULL, as_of date NOT NULL, fetched_at timestamptz NOT NULL DEFAULT now())`,
]);})().catch(e=>{initializing=null;throw e});return initializing;}
export const metalPriceStore:PriceStore={
  async latest(){await initialize();const sql=database();const rows=await sql`SELECT DISTINCT ON (metal) metal,price,unit,source,as_of::text,fetched_at FROM pv_metal_prices ORDER BY metal,fetched_at DESC`;return rows.map(r=>({...r,price:Number(r.price),fetched_at:new Date(r.fetched_at).toISOString()})) as PriceRow[];},
  async save(rows){await initialize();const sql=database();await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(1842741038)`,
    sql`INSERT INTO pv_metal_prices(id,metal,price,unit,source,as_of,fetched_at) SELECT gen_random_uuid(),r.metal,r.price,r.unit,r.source,r.as_of,r.fetched_at FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS r(metal text,price double precision,unit text,source text,as_of date,fetched_at timestamptz) WHERE NOT EXISTS(SELECT 1 FROM pv_metal_prices WHERE fetched_at > now() - interval '6 days')`,
  ]);}
};
export async function effectiveMetalPrices(p:Parameters){try{return applyStoredPrices(p,await metalPriceStore.latest());}catch{return workbookPrices(p);}}
