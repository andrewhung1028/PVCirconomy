import { equipmentInquiryMaterials, equipmentInquiryNotesLimit, equipmentOfftakeStreams } from "../../lib/equipment-mou";
import { database } from "../db/client";

const fields = new Set([
  "configuration", "includePlus", "assessmentDate", "stage", "lineQuantity", "startDate", "configurationRequirements",
  "targetCapacity", "dailyHours", "panelTechnology", "panelCondition", "materials", "polymerOfftake", "offtakeStreams", "glassOfftakePrice",
  "installationCountry", "installationSite", "installationEnvironment", "floorSpace", "floorSpaceUnit",
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
  })().catch(error => {
    storeReady = undefined;
    throw error;
  });
  await storeReady;
  return sql;
}

export async function recordInquirySubmission(fields: [string, string][], formComplete: boolean) {
  const sql = await inquiryStore();
  await sql`INSERT INTO pv_equipment_inquiry_submissions (form_complete, fields)
    VALUES (${formComplete}, ${JSON.stringify(fields)}::jsonb)`;
}

export type InquirySubmission = {
  id: string;
  submitted_at: string;
  form_complete: boolean;
  fields: [string, string][];
};

const pageSize = 25;

export async function listInquirySubmissions(before: unknown) {
  const cursor = typeof before === "string" && /^[1-9]\d{0,18}$/.test(before) && BigInt(before) <= 9223372036854775807n
    ? before
    : null;
  const sql = await inquiryStore();
  const rows = await sql`SELECT id::text AS id, submitted_at, form_complete, fields
    FROM pv_equipment_inquiry_submissions
    WHERE (${cursor}::bigint IS NULL OR id < ${cursor}::bigint)
    ORDER BY pv_equipment_inquiry_submissions.id DESC
    LIMIT ${pageSize + 1}` as InquirySubmission[];
  const records = rows.slice(0, pageSize);
  return {
    records,
    older: rows.length > pageSize ? records.at(-1)?.id : undefined,
    showLatest: cursor !== null,
  };
}
