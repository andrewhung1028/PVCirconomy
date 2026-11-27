import { database } from "../db/client";

let signingStoreReady: Promise<void> | undefined;

export function initializeSigningStore() {
  signingStoreReady ??= (async () => {
    const sql = database();
    await sql`CREATE TABLE IF NOT EXISTS pv_equipment_mou_acceptances (
      id uuid PRIMARY KEY, document jsonb NOT NULL,
      signed_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
    )`;
    await sql`ALTER TABLE pv_equipment_mou_acceptances
      ADD COLUMN IF NOT EXISTS completed_at timestamptz,
      ADD COLUMN IF NOT EXISTS quotation_reference text,
      ADD COLUMN IF NOT EXISTS contract_reference text`;
  })().catch(error => {
    signingStoreReady = undefined;
    throw error;
  });
  return signingStoreReady;
}

export function salesCaseId(value: string) {
  const id = value.trim().replace(/^PV-/i, "");
  return /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id) ? id.toLowerCase() : null;
}

export async function listSalesCases(query: string) {
  const id = salesCaseId(query);
  if (query && !id) return [];
  await initializeSigningStore();
  const sql = database();
  return sql`SELECT id::text, document->'contact'->>'company' AS company, document->'contact'->>'email' AS email,
    document->'input'->>'installationMarket' AS market, document->'input'->>'purchaseOption' AS purchase,
    completed_at, quotation_reference, contract_reference FROM pv_equipment_mou_acceptances
    WHERE completed_at IS NOT NULL AND (${id}::uuid IS NULL OR id = ${id}::uuid)
    ORDER BY completed_at DESC, id DESC LIMIT 25`;
}

export async function linkSalesDocument(id: string, reference: string, kind: string) {
  if (!salesCaseId(id) || !reference || reference.length > 120 || /[\x00-\x1f]/.test(reference)) return false;
  await initializeSigningStore();
  const sql = database();
  // Replaying the same entry is safe; concurrent entries cannot replace another reference.
  const rows = kind === "quotation"
    ? await sql`UPDATE pv_equipment_mou_acceptances SET quotation_reference=${reference}
      WHERE id=${id}::uuid AND completed_at IS NOT NULL AND (quotation_reference IS NULL OR quotation_reference=${reference}) RETURNING id`
    : kind === "contract"
      ? await sql`UPDATE pv_equipment_mou_acceptances SET contract_reference=${reference}
        WHERE id=${id}::uuid AND completed_at IS NOT NULL AND quotation_reference IS NOT NULL
        AND (contract_reference IS NULL OR contract_reference=${reference}) RETURNING id` : [];
  return rows.length === 1;
}
