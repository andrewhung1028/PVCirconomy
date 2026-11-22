import { database } from "../db/client";
import { seededOurSolutionData, validateOurSolutionData, type OurSolutionEconomics } from "../../lib/our-solution-data";

const seedId = "923a41c8-d7dc-4d25-bbc8-31ca7d6964eb";
let initializing: Promise<void> | null = null;

export type OurSolutionSnapshot = { version: string; createdAt: string; data: OurSolutionEconomics };

async function initialize() {
  if (!initializing) initializing = (async () => {
    const sql = database();
    await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(1842741037)`,
      sql`CREATE TABLE IF NOT EXISTS pv_our_solution_versions(id uuid PRIMARY KEY, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), actor_oid text NOT NULL, actor_email text NOT NULL, note text NOT NULL DEFAULT '')`,
      sql`CREATE TABLE IF NOT EXISTS pv_our_solution_active(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), version_id uuid NOT NULL REFERENCES pv_our_solution_versions(id))`,
      sql`INSERT INTO pv_our_solution_versions(id,data,actor_oid,actor_email,note) VALUES(${seedId},${JSON.stringify(seededOurSolutionData)}::jsonb,'initial-setup','system','Initial USD business-case dataset') ON CONFLICT(id) DO NOTHING`,
      sql`INSERT INTO pv_our_solution_active(singleton,version_id) VALUES(true,${seedId}) ON CONFLICT(singleton) DO NOTHING`,
    ]);
  })().catch((error) => { initializing = null; throw error; });
  return initializing;
}

export async function activeOurSolutionData(): Promise<OurSolutionSnapshot> {
  await initialize();
  const sql = database();
  const rows = await sql`SELECT v.id,v.data,v.created_at FROM pv_our_solution_versions v JOIN pv_our_solution_active a ON a.version_id=v.id WHERE a.singleton=true`;
  const row = rows[0];
  const checked = validateOurSolutionData(row?.data);
  if (!row || !checked.valid) throw Error("our_solution_data_unavailable");
  return { version: row.id, createdAt: new Date(row.created_at).toISOString(), data: checked.data };
}

export async function activeOurSolutionDataOrSeed(): Promise<OurSolutionSnapshot> {
  try { return await activeOurSolutionData(); }
  catch { return { version: seedId, createdAt: seededOurSolutionData.meta.extractedAt, data: seededOurSolutionData }; }
}

export async function ourSolutionHistory() {
  await initialize();
  const sql = database();
  const rows = await sql`SELECT v.id,v.created_at,v.actor_email,v.note,(a.version_id=v.id) AS active FROM pv_our_solution_versions v CROSS JOIN pv_our_solution_active a WHERE a.singleton=true ORDER BY v.created_at DESC LIMIT 30`;
  return rows.map((row) => ({ id: row.id, createdAt: new Date(row.created_at).toISOString(), actorEmail: row.actor_email, note: row.note, active: Boolean(row.active) }));
}

export async function ourSolutionVersion(id: string): Promise<OurSolutionSnapshot | null> {
  if (!/^[a-f\d-]{36}$/i.test(id)) return null;
  await initialize();
  const sql = database();
  const rows = await sql`SELECT id,data,created_at FROM pv_our_solution_versions WHERE id=${id}::uuid`;
  const row = rows[0];
  const checked = validateOurSolutionData(row?.data);
  return row && checked.valid ? { version: row.id, createdAt: new Date(row.created_at).toISOString(), data: checked.data } : null;
}

export async function saveOurSolutionData(data: OurSolutionEconomics, expectedVersion: string, actor: { oid: string; email: string }, note = "") {
  const checked = validateOurSolutionData(data);
  if (!checked.valid) throw Error("invalid_our_solution_data");
  if (typeof note !== "string" || note.length > 500 || note.includes("\0")) throw Error("invalid_note");
  await initialize();
  const sql = database();
  const id = crypto.randomUUID();
  const rows = await sql`WITH inserted AS (INSERT INTO pv_our_solution_versions(id,data,actor_oid,actor_email,note) SELECT ${id},${JSON.stringify(checked.data)}::jsonb,${actor.oid},${actor.email},${note.trim()} WHERE EXISTS(SELECT 1 FROM pv_our_solution_active WHERE singleton=true AND version_id=${expectedVersion}::uuid) RETURNING id) UPDATE pv_our_solution_active SET version_id=(SELECT id FROM inserted) WHERE singleton=true AND version_id=${expectedVersion}::uuid AND EXISTS(SELECT 1 FROM inserted) RETURNING version_id`;
  if (!rows.length) return null;
  return activeOurSolutionData();
}
