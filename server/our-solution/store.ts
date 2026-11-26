import { database } from "../db/client";
import { seededOurSolutionData, effectiveParameters, validateOurSolutionData, type OurSolutionEconomics } from "../../lib/our-solution-data";
import { seededJapanOurSolutionData } from "../../lib/our-solution-japan-data";
import { assertOurSolutionMarketRegion, type OurSolutionMarket, type OurSolutionParameterMarket } from "../../lib/our-solution/market";
import { commonAssumptionSchema, sharedParameters, marketParameters, withSharedParameters, sharedAssumptionKeys, type SharedParameters } from "../../lib/our-solution/shared";
import { parameter } from "../../lib/our-solution/parameters";

export { assertOurSolutionMarketRegion, ourSolutionMarket, ourSolutionMarkets } from "../../lib/our-solution/market";
export type { OurSolutionMarket } from "../../lib/our-solution/market";

const seedId = "923a41c8-d7dc-4d25-bbc8-31ca7d6964eb";
const japanSeedId = "f0f87bb1-99a1-4ed2-b5cb-7ea1c72065f4";
let initializing: Promise<void> | null = null;
let initializingJapan: Promise<void> | null = null;
let initializingShared: Promise<void> | null = null;
let initializingMarketVersions: Promise<void> | null = null;

export type OurSolutionSnapshot = { version: string; createdAt: string; data: OurSolutionEconomics };

function currentSeed(reference: OurSolutionEconomics): OurSolutionEconomics {
  const data = effectiveParameters(structuredClone(reference));
  // Keep fallbacks aligned with the approved 50 MW/year, 300 W and 20 kg scenario.
  data.scenario.panels_per_month = 50_000_000 / 300 / 12;
  if (data.scenario.region_code === "JP") {
    data.scenario.panel_weight_kg = 20;
  } else {
    data.scenario.panel_weight_lb = 20 / parameter(data, 3, "Kilograms per pound");
  }
  data.assumptions[10]["Panel rating"][0] = 300;
  data.assumptions[6].EVA[3] = 0;
  data.assumptions[6].Backsheet[3] = 0;
  return data;
}

const usSeed = currentSeed(seededOurSolutionData);
const jpSeed = currentSeed(seededJapanOurSolutionData);

async function initialize() {
  if (!initializing) initializing = (async () => {
    const sql = database();
    await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(1842741037)`,
      sql`CREATE TABLE IF NOT EXISTS pv_our_solution_versions(id uuid PRIMARY KEY, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), actor_oid text NOT NULL, actor_email text NOT NULL, note text NOT NULL DEFAULT '')`,
      sql`CREATE TABLE IF NOT EXISTS pv_our_solution_active(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), version_id uuid NOT NULL REFERENCES pv_our_solution_versions(id))`,
      sql`INSERT INTO pv_our_solution_versions(id,data,actor_oid,actor_email,note) SELECT ${seedId}::uuid,${JSON.stringify(usSeed)}::jsonb,'initial-setup','system','Initial USD business-case dataset' WHERE NOT EXISTS (SELECT 1 FROM pv_our_solution_active WHERE singleton) ON CONFLICT(id) DO NOTHING`,
      sql`INSERT INTO pv_our_solution_active(singleton,version_id) SELECT true,id FROM pv_our_solution_versions WHERE id=${seedId}::uuid ON CONFLICT(singleton) DO NOTHING`,
    ]);
  })().catch((error) => { initializing = null; throw error; });
  return initializing;
}

async function initializeJapan() {
  if (!initializingJapan) initializingJapan = (async () => {
    const sql = database();
    await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(1842741039)`,
      sql`CREATE TABLE IF NOT EXISTS pv_our_solution_jp_versions(id uuid PRIMARY KEY, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), actor_oid text NOT NULL, actor_email text NOT NULL, note text NOT NULL DEFAULT '')`,
      sql`CREATE TABLE IF NOT EXISTS pv_our_solution_jp_active(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), version_id uuid NOT NULL REFERENCES pv_our_solution_jp_versions(id))`,
      sql`INSERT INTO pv_our_solution_jp_versions(id,data,actor_oid,actor_email,note) SELECT ${japanSeedId}::uuid,${JSON.stringify(jpSeed)}::jsonb,'initial-setup','system','Initial Japan parameter master' WHERE NOT EXISTS (SELECT 1 FROM pv_our_solution_jp_active WHERE singleton) ON CONFLICT(id) DO NOTHING`,
      sql`INSERT INTO pv_our_solution_jp_active(singleton,version_id) SELECT true,id FROM pv_our_solution_jp_versions WHERE id=${japanSeedId}::uuid ON CONFLICT(singleton) DO NOTHING`,
    ]);
  })().catch((error) => { initializingJapan = null; throw error; });
  return initializingJapan;
}

const marketSeed = (market: OurSolutionMarket) => market === "JP" ? jpSeed : usSeed;
const marketSeedId = (market: OurSolutionMarket) => market === "JP" ? japanSeedId : seedId;

async function initializeMarketVersions() {
  if (!initializingMarketVersions) initializingMarketVersions = (async () => {
    const sql = database();
    await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(1842741040)`,
      sql`CREATE TABLE IF NOT EXISTS pv_our_solution_market_versions(market text NOT NULL, id uuid NOT NULL, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), actor_oid text NOT NULL, actor_email text NOT NULL, note text NOT NULL DEFAULT '', PRIMARY KEY (market,id))`,
      sql`CREATE TABLE IF NOT EXISTS pv_our_solution_market_active(market text PRIMARY KEY, version_id uuid NOT NULL, FOREIGN KEY (market,version_id) REFERENCES pv_our_solution_market_versions(market,id))`,
    ]);
  })().catch(error => { initializingMarketVersions = null; throw error; });
  return initializingMarketVersions;
}

export type SharedSnapshot = { version: string; createdAt: string; data: SharedParameters };

export function validateSharedParameters(data: unknown) {
  try {
    const shared = data as SharedParameters;
    if (Object.keys(shared.assumptions).length !== Object.keys(sharedAssumptionKeys).length) return false;
    for (const [section, keys] of Object.entries(sharedAssumptionKeys)) {
      if (Object.keys(shared.assumptions[section]).length !== keys.length ||
        keys.some(key => !(Number(shared.assumptions[section][key]?.[0]) > 0) || shared.assumptions[section][key]?.[1] !== usSeed.assumptions[section][key][1])) return false;
    }
    if (shared.commonAssumptions !== undefined) {
      if (Object.keys(shared.commonAssumptions).length !== Object.keys(commonAssumptionSchema).length) return false;
      for (const [section, definitions] of Object.entries(commonAssumptionSchema)) {
        const rows = shared.commonAssumptions[section];
        if (!rows || Object.keys(rows).length !== Object.keys(definitions).length) return false;
        for (const [key, definition] of Object.entries(definitions)) {
          const row = rows[key];
          if (!Array.isArray(row) || row.length !== definition.length ||
            row.some((value, index) => typeof definition[index] === "string" && value !== usSeed.assumptions[section][key][index])) return false;
        }
      }
    }
    return validateOurSolutionData(withSharedParameters(usSeed, shared)).valid;
  } catch {
    return false;
  }
}

async function initializeShared() {
  if (!initializingShared) initializingShared = (async () => {
    await initialize();
    const sql = database();
    await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(1842741042)`,
      sql`CREATE TABLE IF NOT EXISTS pv_our_solution_shared_versions(id uuid PRIMARY KEY, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), actor_oid text NOT NULL, actor_email text NOT NULL, note text NOT NULL DEFAULT '')`,
      sql`CREATE TABLE IF NOT EXISTS pv_our_solution_shared_active(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), version_id uuid NOT NULL REFERENCES pv_our_solution_shared_versions(id))`,
    ]);
    const [active] = await sql`SELECT version_id FROM pv_our_solution_shared_active WHERE singleton`;
    if (active) return;
    const [legacy] = await sql`SELECT v.data FROM pv_our_solution_versions v JOIN pv_our_solution_active a ON a.version_id=v.id WHERE a.singleton`;
    const candidate = sharedParameters(effectiveParameters(legacy?.data));
    const data = validateSharedParameters(candidate) ? candidate : sharedParameters(usSeed);
    const id = crypto.randomUUID();
    await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(1842741042)`,
      sql`WITH seeded AS (
        INSERT INTO pv_our_solution_shared_versions(id,data,actor_oid,actor_email,note)
        SELECT ${id}::uuid,${JSON.stringify(data)}::jsonb,'initial-setup','system','Global baseline from the existing US parameter master'
        WHERE NOT EXISTS (SELECT 1 FROM pv_our_solution_shared_active WHERE singleton)
        RETURNING id
      ) INSERT INTO pv_our_solution_shared_active(singleton,version_id) SELECT true,id FROM seeded ON CONFLICT(singleton) DO NOTHING`,
    ]);
  })().catch(error => { initializingShared = null; throw error; });
  return initializingShared;
}

function readSharedSnapshot(row: { id: string; created_at: string; data: SharedParameters }): SharedSnapshot {
  if (!validateSharedParameters(row.data)) throw Error("invalid_our_solution_shared_data");
  return { version: row.id, createdAt: new Date(row.created_at).toISOString(), data: row.data };
}

export async function activeSharedParameters(): Promise<SharedSnapshot> {
  await initializeShared();
  const sql = database();
  const [row] = await sql`SELECT v.id,v.data,v.created_at FROM pv_our_solution_shared_versions v JOIN pv_our_solution_shared_active a ON a.version_id=v.id WHERE a.singleton`;
  if (!row) throw Error("our_solution_shared_data_unavailable");
  return readSharedSnapshot(row as Parameters<typeof readSharedSnapshot>[0]);
}

export async function ourSolutionSharedVersion(id: string): Promise<SharedSnapshot | null> {
  if (!/^[a-f\d-]{36}$/i.test(id)) return null;
  await initializeShared();
  const sql = database();
  const [row] = await sql`SELECT id,data,created_at FROM pv_our_solution_shared_versions WHERE id=${id}::uuid`;
  return row ? readSharedSnapshot(row as Parameters<typeof readSharedSnapshot>[0]) : null;
}

export async function ourSolutionSharedHistory() {
  await initializeShared();
  const sql = database();
  const rows = await sql`SELECT v.id,v.created_at,v.actor_email,v.note,(a.version_id=v.id) AS active FROM pv_our_solution_shared_versions v CROSS JOIN pv_our_solution_shared_active a WHERE a.singleton ORDER BY v.created_at DESC LIMIT 30`;
  return rows.map(row => ({ id: row.id, createdAt: new Date(row.created_at).toISOString(), actorEmail: row.actor_email, note: row.note, active: Boolean(row.active) }));
}

export async function saveSharedParameters(data: SharedParameters, expectedVersion: string, actor: { oid: string; email: string }, note: string) {
  if (!validateSharedParameters(data)) throw Error("invalid_our_solution_shared_data");
  await initializeShared();
  const sql = database();
  const id = crypto.randomUUID();
  const [, rows] = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(1842741042)`,
    sql`WITH inserted AS (
      INSERT INTO pv_our_solution_shared_versions(id,data,actor_oid,actor_email,note)
      SELECT ${id}::uuid,${JSON.stringify(data)}::jsonb,${actor.oid},${actor.email},${note.trim()}
      WHERE EXISTS (
        SELECT 1 FROM pv_our_solution_shared_active a JOIN pv_our_solution_shared_versions v ON v.id=a.version_id
        WHERE a.singleton AND a.version_id=${expectedVersion}::uuid
          AND (${Boolean(data.commonAssumptions)} OR NOT (v.data ? 'commonAssumptions'))
      )
      RETURNING id,data,created_at
    ), published AS (
      UPDATE pv_our_solution_shared_active SET version_id=(SELECT id FROM inserted) WHERE singleton AND EXISTS (SELECT 1 FROM inserted) RETURNING version_id
    ) SELECT i.id,i.data,i.created_at FROM inserted i JOIN published p ON p.version_id=i.id`,
  ]);
  return rows.length ? readSharedSnapshot(rows[0] as Parameters<typeof readSharedSnapshot>[0]) : null;
}

async function readMarketSnapshot(row: { id: string; created_at: string; data: unknown }): Promise<OurSolutionSnapshot> {
  const market = row.data as OurSolutionEconomics;
  if (market?.format !== "parameters-v2") throw Error("invalid_our_solution_market_data");
  const checked = validateOurSolutionData(withSharedParameters(market, (await activeSharedParameters()).data));
  if (!checked.valid) throw Error("invalid_our_solution_market_data");
  return { version: row.id, createdAt: new Date(row.created_at).toISOString(), data: checked.data };
}

export async function activeOurSolutionParameterData(market: OurSolutionParameterMarket): Promise<OurSolutionSnapshot | null> {
  if (market === "US" || market === "JP") return activeOurSolutionData(market);
  await initializeMarketVersions();
  const sql = database();
  const [row] = await sql`SELECT v.id,v.data,v.created_at FROM pv_our_solution_market_versions v JOIN pv_our_solution_market_active a ON a.market=v.market AND a.version_id=v.id WHERE a.market=${market}`;
  return row ? readMarketSnapshot(row as Parameters<typeof readMarketSnapshot>[0]) : null;
}

export async function activeOurSolutionData(market: OurSolutionMarket = "US"): Promise<OurSolutionSnapshot> {
  if (market === "JP") {
    await initializeJapan();
    const sql = database();
    const rows = await sql`SELECT v.id,v.data,v.created_at FROM pv_our_solution_jp_versions v JOIN pv_our_solution_jp_active a ON a.version_id=v.id WHERE a.singleton=true`;
    const row = rows[0];
    const checked = validateOurSolutionData(withSharedParameters(effectiveParameters(row?.data), (await activeSharedParameters()).data));
    if (!row || !checked.valid) throw Error("our_solution_jp_data_unavailable");
    return { version: row.id, createdAt: new Date(row.created_at).toISOString(), data: checked.data };
  }
  await initialize();
  const sql = database();
  const rows = await sql`SELECT v.id,v.data,v.created_at FROM pv_our_solution_versions v JOIN pv_our_solution_active a ON a.version_id=v.id WHERE a.singleton=true`;
  const row = rows[0];
  const checked = validateOurSolutionData(withSharedParameters(effectiveParameters(row?.data), (await activeSharedParameters()).data));
  if (!row || !checked.valid) throw Error("our_solution_data_unavailable");
  return { version: row.id, createdAt: new Date(row.created_at).toISOString(), data: checked.data };
}

export async function activeOurSolutionDataOrSeed(market: OurSolutionMarket = "US"): Promise<OurSolutionSnapshot> {
  try { return await activeOurSolutionData(market); }
  catch {
    const shared = await activeSharedParameters().then(snapshot => snapshot.data).catch(() => sharedParameters(usSeed));
    const data = withSharedParameters(marketSeed(market), shared);
    return { version: marketSeedId(market), createdAt: data.meta.extractedAt, data };
  }
}

export async function ourSolutionHistory(market: OurSolutionParameterMarket = "US") {
  if (market !== "US" && market !== "JP") {
    await initializeMarketVersions();
    const sql = database();
    const rows = await sql`SELECT v.id,v.created_at,v.actor_email,v.note,(a.version_id=v.id) AS active FROM pv_our_solution_market_versions v JOIN pv_our_solution_market_active a ON a.market=v.market WHERE v.market=${market} ORDER BY v.created_at DESC LIMIT 30`;
    return rows.map(row => ({ id: row.id, createdAt: new Date(row.created_at).toISOString(), actorEmail: row.actor_email, note: row.note, active: Boolean(row.active) }));
  }
  if (market === "JP") {
    await initializeJapan();
    const sql = database();
    const rows = await sql`SELECT v.id,v.created_at,v.actor_email,v.note,(a.version_id=v.id) AS active FROM pv_our_solution_jp_versions v CROSS JOIN pv_our_solution_jp_active a WHERE a.singleton=true ORDER BY v.created_at DESC LIMIT 30`;
    return rows.map((row) => ({ id: row.id, createdAt: new Date(row.created_at).toISOString(), actorEmail: row.actor_email, note: row.note, active: Boolean(row.active) }));
  }
  await initialize();
  const sql = database();
  const rows = await sql`SELECT v.id,v.created_at,v.actor_email,v.note,(a.version_id=v.id) AS active FROM pv_our_solution_versions v CROSS JOIN pv_our_solution_active a WHERE a.singleton=true ORDER BY v.created_at DESC LIMIT 30`;
  return rows.map((row) => ({ id: row.id, createdAt: new Date(row.created_at).toISOString(), actorEmail: row.actor_email, note: row.note, active: Boolean(row.active) }));
}

export async function ourSolutionVersion(id: string, market: OurSolutionParameterMarket = "US"): Promise<OurSolutionSnapshot | null> {
  if (!/^[a-f\d-]{36}$/i.test(id)) return null;
  if (market !== "US" && market !== "JP") {
    await initializeMarketVersions();
    const sql = database();
    const [row] = await sql`SELECT id,data,created_at FROM pv_our_solution_market_versions WHERE market=${market} AND id=${id}::uuid`;
    return row ? readMarketSnapshot(row as Parameters<typeof readMarketSnapshot>[0]) : null;
  }
  if (market === "JP") {
    await initializeJapan();
    const sql = database();
    const rows = await sql`SELECT id,data,created_at FROM pv_our_solution_jp_versions WHERE id=${id}::uuid`;
    const row = rows[0];
    const checked = validateOurSolutionData(withSharedParameters(effectiveParameters(row?.data), (await activeSharedParameters()).data));
    return row && checked.valid ? { version: row.id, createdAt: new Date(row.created_at).toISOString(), data: checked.data } : null;
  }
  await initialize();
  const sql = database();
  const rows = await sql`SELECT id,data,created_at FROM pv_our_solution_versions WHERE id=${id}::uuid`;
  const row = rows[0];
  const checked = validateOurSolutionData(withSharedParameters(effectiveParameters(row?.data), (await activeSharedParameters()).data));
  return row && checked.valid ? { version: row.id, createdAt: new Date(row.created_at).toISOString(), data: checked.data } : null;
}

export async function saveOurSolutionData(data: OurSolutionEconomics, expectedVersion: string | null, actor: { oid: string; email: string }, note = "", market: OurSolutionParameterMarket = "US") {
  const checked = validateOurSolutionData(withSharedParameters(data, (await activeSharedParameters()).data));
  if (!checked.valid) throw Error("invalid_our_solution_data");
  if (typeof note !== "string" || note.length > 500 || note.includes("\0")) throw Error("invalid_note");
  if (market !== "US" && market !== "JP") {
    assertOurSolutionMarketRegion(market, checked.data.scenario.region_code);
    await initializeMarketVersions();
    const sql = database();
    const id = crypto.randomUUID();
    const [,rows] = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(1842741041,hashtext(${market}))`,
      sql`WITH inserted AS (
        INSERT INTO pv_our_solution_market_versions(market,id,data,actor_oid,actor_email,note)
        SELECT ${market},${id}::uuid,${JSON.stringify(marketParameters(checked.data))}::jsonb,${actor.oid},${actor.email},${note.trim()}
        WHERE (SELECT version_id FROM pv_our_solution_market_active WHERE market=${market}) IS NOT DISTINCT FROM ${expectedVersion}::uuid
        RETURNING market,id,data,created_at
      ), published AS (
        INSERT INTO pv_our_solution_market_active(market,version_id) SELECT market,id FROM inserted
        ON CONFLICT(market) DO UPDATE SET version_id=excluded.version_id RETURNING version_id
      ) SELECT i.id,i.data,i.created_at FROM inserted i JOIN published p ON p.version_id=i.id`,
    ]);
    return rows.length ? readMarketSnapshot(rows[0] as Parameters<typeof readMarketSnapshot>[0]) : null;
  }
  if (expectedVersion === null) return null;
  if (market === "JP") {
    await initializeJapan();
    const sql = database();
    const id = crypto.randomUUID();
    const rows = await sql`WITH inserted AS (INSERT INTO pv_our_solution_jp_versions(id,data,actor_oid,actor_email,note) SELECT ${id},${JSON.stringify(marketParameters(checked.data))}::jsonb,${actor.oid},${actor.email},${note.trim()} WHERE EXISTS(SELECT 1 FROM pv_our_solution_jp_active WHERE singleton=true AND version_id=${expectedVersion}::uuid) RETURNING id) UPDATE pv_our_solution_jp_active SET version_id=(SELECT id FROM inserted) WHERE singleton=true AND version_id=${expectedVersion}::uuid AND EXISTS(SELECT 1 FROM inserted) RETURNING version_id`;
    if (!rows.length) return null;
    return activeOurSolutionData("JP");
  }
  await initialize();
  const sql = database();
  const id = crypto.randomUUID();
  const rows = await sql`WITH inserted AS (INSERT INTO pv_our_solution_versions(id,data,actor_oid,actor_email,note) SELECT ${id},${JSON.stringify(marketParameters(checked.data))}::jsonb,${actor.oid},${actor.email},${note.trim()} WHERE EXISTS(SELECT 1 FROM pv_our_solution_active WHERE singleton=true AND version_id=${expectedVersion}::uuid) RETURNING id) UPDATE pv_our_solution_active SET version_id=(SELECT id FROM inserted) WHERE singleton=true AND version_id=${expectedVersion}::uuid AND EXISTS(SELECT 1 FROM inserted) RETURNING version_id`;
  if (!rows.length) return null;
  return activeOurSolutionData();
}
