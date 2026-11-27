import { equipmentInquiryMaterials, equipmentInquiryNotesLimit, equipmentOfftakeStreams, type EquipmentMouContact } from "../../lib/equipment-mou";
import { database } from "../db/client";

const fields = new Set([
  "configuration", "includePlus", "purchaseOption", "assessmentDate", "stage", "lineQuantity", "startDate", "configurationRequirements",
  "targetCapacity", "dailyHours", "panelTechnology", "panelCondition", "materials", "polymerOfftake", "offtakeStreams", "glassOfftakePrice",
  "installationCountry", "installationSite", "installationPostalCode", "installationEnvironment", "floorSpace", "floorSpaceUnit",
  "powerSupply", "compressedAir", "siteNetwork", "requirements", "company", "companyAddress", "jobTitle", "name", "email", "phone",
  ...equipmentInquiryMaterials.map(material => `materialPurity[${material}]`),
]);

export function parseInquirySubmission(value: unknown): [string, string][] | null {
  if (!Array.isArray(value) || value.length > fields.size + equipmentInquiryMaterials.length + equipmentOfftakeStreams.length - 2) return null;
  const entries: [string, string][] = [];
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== "string" || typeof entry[1] !== "string") return null;
    const [key, raw] = entry;
    if (fields.has(key)) entries.push([key, raw.trim().slice(0, equipmentInquiryNotesLimit)]);
  }
  return entries.length ? entries : null;
}

let storeReady: Promise<void> | undefined;

async function inquiryStore() {
  const sql = database();
  storeReady ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS pv_equipment_inquiry_submissions (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      submitted_at timestamptz NOT NULL DEFAULT now(),
      form_complete boolean NOT NULL,
      fields jsonb NOT NULL
    )`;
    await sql`ALTER TABLE pv_equipment_inquiry_submissions ADD COLUMN IF NOT EXISTS verified_contact jsonb, ADD COLUMN IF NOT EXISTS mou_id uuid`;
  })().catch(error => {
    storeReady = undefined;
    throw error;
  });
  await storeReady;
  return sql;
}

export async function recordInquirySubmission(fields: [string, string][], formComplete: boolean) {
  const sql = await inquiryStore();
  const [record] = await sql`INSERT INTO pv_equipment_inquiry_submissions (form_complete, fields)
    VALUES (${formComplete}, ${JSON.stringify(fields)}::jsonb) RETURNING id::text AS id`;
  return record.id as string;
}

export async function linkInquiryMou(submissionId: string, mouId: string) {
  const sql = await inquiryStore();
  await sql`UPDATE pv_equipment_inquiry_submissions SET mou_id=${mouId}::uuid WHERE id=${submissionId}::bigint`;
}

type VerifiedInquiryContact = Pick<EquipmentMouContact, "email" | "company" | "name">;

export async function recordVerifiedInquiryContact(id: string | undefined, contact: EquipmentMouContact, fields: [string, string][]) {
  const sql = await inquiryStore();
  const verified: VerifiedInquiryContact = { email: contact.email.trim().toLowerCase(), company: contact.company.trim(), name: contact.name.trim() };
  if (id) {
    await sql`UPDATE pv_equipment_inquiry_submissions SET verified_contact = ${JSON.stringify(verified)}::jsonb
      WHERE id = ${id}::bigint`;
  } else {
    await sql`INSERT INTO pv_equipment_inquiry_submissions (form_complete, fields, verified_contact)
      VALUES (true, ${JSON.stringify(fields)}::jsonb, ${JSON.stringify(verified)}::jsonb)`;
  }
}

export type InquirySubmission = {
  id: string;
  submitted_at: string;
  mou_id: string | null;
  form_complete: boolean;
  fields: [string, string][];
  verified_contact: VerifiedInquiryContact | null;
};

const pageSize = 25;

export async function listInquirySubmissions(before: unknown, mouId: string | null = null) {
  const cursor = typeof before === "string" && /^[1-9]\d{0,18}$/.test(before) && BigInt(before) <= 9223372036854775807n
    ? before
    : null;
  const sql = await inquiryStore();
  const rows = await sql`SELECT id::text AS id, mou_id::text, submitted_at, form_complete, fields, verified_contact
    FROM pv_equipment_inquiry_submissions
    WHERE (${cursor}::bigint IS NULL OR id < ${cursor}::bigint)
      AND (${mouId}::uuid IS NULL OR mou_id = ${mouId}::uuid)
    ORDER BY pv_equipment_inquiry_submissions.id DESC
    LIMIT ${pageSize + 1}` as InquirySubmission[];
  const records = rows.slice(0, pageSize);
  return {
    records,
    older: rows.length > pageSize ? records.at(-1)?.id : undefined,
    showLatest: cursor !== null,
  };
}
