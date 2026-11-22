import {deliverySettings} from '../delivery/store';
import { database } from '../db/client';
import { initialRules, defaultWeightRules, normalizeRules, validRules, type PricingSnapshot, type PricingRules } from '../../lib/pricing-rules';
const seedId='d8af59bc-dc76-4b46-9c38-547e1af36ee1';
let initializing:Promise<void>|null=null;
export async function initializePricing(){
 if(!initializing)initializing=(async()=>{const sql=database();await sql.transaction([
 sql`SELECT pg_advisory_xact_lock(1842741021)`,
 sql`CREATE TABLE IF NOT EXISTS pv_pricing_versions(id uuid PRIMARY KEY, rules jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), actor_oid text NOT NULL, actor_email text NOT NULL)`,
 sql`ALTER TABLE pv_pricing_versions ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT ''`,
 sql`ALTER TABLE pv_pricing_versions ADD COLUMN IF NOT EXISTS note_title text NOT NULL DEFAULT ''`,
 sql`CREATE TABLE IF NOT EXISTS pv_pricing_active(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), version_id uuid NOT NULL REFERENCES pv_pricing_versions(id))`,
 sql`INSERT INTO pv_pricing_versions(id,rules,actor_oid,actor_email) VALUES(${seedId},${JSON.stringify(initialRules)}::jsonb,'initial-setup','initial-setup') ON CONFLICT(id) DO NOTHING`,
 sql`INSERT INTO pv_pricing_active(singleton,version_id) VALUES(true,${seedId}) ON CONFLICT(singleton) DO NOTHING`,
 sql`WITH added AS (INSERT INTO pv_pricing_versions(id,rules,actor_oid,actor_email) SELECT ${crypto.randomUUID()},${JSON.stringify(defaultWeightRules)}::jsonb || v.rules,'weight-coefficient-upgrade','system' FROM pv_pricing_versions v JOIN pv_pricing_active a ON a.version_id=v.id WHERE a.singleton=true AND (NOT(v.rules ? 'doubleGlassGramsPerWatt') OR NOT(v.rules ? 'backsheetGramsPerWatt') OR NOT(v.rules ? 'doubleGlassKgPerSqm') OR NOT(v.rules ? 'backsheetKgPerSqm') OR NOT(v.rules ? 'unknownKgPerSqm') OR NOT(v.rules ? 'unknownGramsPerWatt')) RETURNING id) UPDATE pv_pricing_active SET version_id=(SELECT id FROM added) WHERE singleton=true AND EXISTS(SELECT 1 FROM added)`
 ]);})().catch(e=>{initializing=null;throw e});return initializing;
}
export async function activePricing():Promise<PricingSnapshot>{await initializePricing();const sql=database();const rows=await sql`SELECT v.id,v.rules,v.created_at FROM pv_pricing_versions v JOIN pv_pricing_active a ON a.version_id=v.id WHERE a.singleton=true`;const row=rows[0];const rules=normalizeRules(row?.rules);if(!row||!rules)throw Error('pricing_unavailable');const transport=await deliverySettings();return {version:row.id,createdAt:new Date(row.created_at).toISOString(),rules,transport:transport.settings.transport,transportVersion:transport.version};}
export async function pricingHistory(){await initializePricing();const sql=database();const rows=await sql`SELECT id,rules,created_at,actor_email,note,note_title FROM pv_pricing_versions ORDER BY created_at DESC LIMIT 30`;return rows.map(row=>({...row,rules:normalizeRules(row.rules)??row.rules}));}
export async function savePricing(rules:PricingRules,expectedVersion:string,actor:{oid:string;email:string},note:string='',noteTitle:string=''){
 if(typeof noteTitle!=='string'||noteTitle.length>160||/[\r\n\0]/.test(noteTitle))throw Error('invalid_note_title');if(typeof note!=='string'||note.length>2000||note.includes('\0'))throw Error('invalid_note');await initializePricing();const sql=database();const id=crypto.randomUUID();const rows=await sql`WITH inserted AS (INSERT INTO pv_pricing_versions(id,rules,actor_oid,actor_email,note,note_title) SELECT ${id},${JSON.stringify(rules)}::jsonb,${actor.oid},${actor.email},${note.trim()},${noteTitle.trim()} WHERE EXISTS(SELECT 1 FROM pv_pricing_active WHERE singleton=true AND version_id=${expectedVersion}::uuid) RETURNING id) UPDATE pv_pricing_active SET version_id=(SELECT id FROM inserted) WHERE singleton=true AND version_id=${expectedVersion}::uuid AND EXISTS(SELECT 1 FROM inserted) RETURNING version_id`;
 if(!rows.length)return null;return activePricing();
}
