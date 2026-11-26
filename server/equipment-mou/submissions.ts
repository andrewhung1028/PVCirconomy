import { equipmentInquiryMaterials, equipmentInquiryNotesLimit } from "../../lib/equipment-mou";
import { database } from "../db/client";

const fields = new Set([
  "configuration", "includePlus", "assessmentDate", "stage", "lineQuantity", "startDate", "configurationRequirements",
  "targetCapacity", "dailyHours", "panelTechnology", "panelCondition", "materials", "polymerOfftake",
  "installationCountry", "installationSite", "installationEnvironment", "floorSpace", "floorSpaceUnit",
  "powerSupply", "compressedAir", "siteNetwork", "requirements", "company", "companyAddress", "jobTitle", "name", "email", "phone",
  ...equipmentInquiryMaterials.map(material => `materialPurity[${material}]`),
]);

export function parseInquirySubmission(value: unknown): [string, string][] | null {
  if (!Array.isArray(value) || value.length > fields.size + equipmentInquiryMaterials.length - 1) return null;
  const entries: [string, string][] = [];
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== "string" || typeof entry[1] !== "string") return null;
    const [key, raw] = entry;
    if (fields.has(key)) entries.push([key, raw.trim().slice(0, equipmentInquiryNotesLimit)]);
  }
  return entries.length ? entries : null;
}

let storeReady: Promise<void> | undefined;

export async function recordInquirySubmission(fields: [string, string][], formComplete: boolean) {
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
  await sql`INSERT INTO pv_equipment_inquiry_submissions (form_complete, fields)
    VALUES (${formComplete}, ${JSON.stringify(fields)}::jsonb)`;
}
