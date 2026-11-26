import { defaultEquipmentQuantitative, validateEquipmentQuantitative, type EquipmentQuantitativeSettings } from "../../lib/equipment-quantitative";
import {
  defaultEquipmentConfigurations, equipmentElectricalFields, equipmentSpecificationGroups, equipmentVariants,
  type EquipmentConfiguration, type EquipmentConfigurations, type EquipmentElectrical, type EquipmentSettings,
} from "../../lib/equipment-configurations";
import { validateEquipmentModulePrices, type EquipmentModulePrices } from "../../lib/equipment-module-pricing";
import { initialEquipmentModulePrices } from "./pricing";
import { database } from "../db/client";

const labels = equipmentSpecificationGroups.flatMap(group => group.items.map(([label]) => label));

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function validateEquipmentConfigurations(value: unknown): EquipmentConfigurations | null {
  const root = object(value);
  const result = {} as EquipmentConfigurations;
  for (const variant of equipmentVariants) {
    const { values, electrical } = object(root[variant]);
    const inputValues = object(values);
    const inputElectrical = object(electrical);
    const cleanedValues = {} as EquipmentConfiguration["values"];
    const cleanedElectrical = {} as EquipmentElectrical;
    for (const label of labels) {
      const entry = inputValues[label];
      if (typeof entry !== "string" || entry.length > 160 || /[\x00-\x1f]/.test(entry)) return null;
      cleanedValues[label] = entry.trim() || "—";
    }
    for (const { key, min, max } of equipmentElectricalFields) {
      const entry = inputElectrical[key];
      if (entry !== null && (typeof entry !== "number" || !Number.isFinite(entry) || entry < min || entry > max)) return null;
      cleanedElectrical[key] = entry;
    }
    const { ratedCurrent, operatingCurrent, standbyCurrent, lineVoltage, powerFactor } = cleanedElectrical;
    if ([ratedCurrent, operatingCurrent, standbyCurrent].some(current => current !== null)
      && (lineVoltage === null || powerFactor === null)) return null;
    result[variant] = { values: cleanedValues, electrical: cleanedElectrical };
  }
  return result;
}

let initialized: Promise<void> | undefined;

async function ensureTable() {
  initialized ??= (async () => {
    const sql = database();
    await sql`CREATE TABLE IF NOT EXISTS pv_equipment_configuration_versions (
      revision integer PRIMARY KEY,
      configurations jsonb NOT NULL,
      msrp jsonb,
      module_prices jsonb,
      quantitative jsonb,
      saved_at timestamptz NOT NULL DEFAULT now(),
      actor_email text NOT NULL
    )`;
    await sql`ALTER TABLE pv_equipment_configuration_versions ADD COLUMN IF NOT EXISTS msrp jsonb, ADD COLUMN IF NOT EXISTS module_prices jsonb, ADD COLUMN IF NOT EXISTS quantitative jsonb`;
  })().catch(error => { initialized = undefined; throw error; });
  await initialized;
}

function settings(row: { revision: number; configurations: unknown; module_prices: unknown; quantitative: unknown; saved_at: string }): EquipmentSettings {
  const configurations = validateEquipmentConfigurations(row.configurations);
  const modulePrices = row.module_prices === null ? initialEquipmentModulePrices : validateEquipmentModulePrices(row.module_prices);
  const quantitative = row.quantitative == null ? defaultEquipmentQuantitative : validateEquipmentQuantitative(row.quantitative);
  if (!configurations || !modulePrices || !quantitative) throw Error("invalid_stored_equipment_settings");
  return { revision: row.revision, configurations, modulePrices, quantitative, savedAt: new Date(row.saved_at).toISOString() };
}

export async function loadEquipmentSettings(): Promise<EquipmentSettings> {
  await ensureTable();
  const sql = database();
  const [row] = await sql`SELECT revision, configurations, module_prices, quantitative, saved_at
    FROM pv_equipment_configuration_versions ORDER BY revision DESC LIMIT 1`;
  return row ? settings(row as Parameters<typeof settings>[0])
    : { revision: 0, configurations: defaultEquipmentConfigurations, modulePrices: initialEquipmentModulePrices, quantitative: defaultEquipmentQuantitative, savedAt: null };
}

export async function publicEquipmentData() {
  const fallback = { configurations: defaultEquipmentConfigurations, quantitative: defaultEquipmentQuantitative };
  if (!process.env.DATABASE_URL) return fallback;
  try {
    const { configurations, quantitative } = await loadEquipmentSettings();
    return { configurations, quantitative };
  } catch {
    return fallback;
  }
}

export async function equipmentSettingsForInquiry() {
  if (!process.env.DATABASE_URL) return { modulePrices: initialEquipmentModulePrices, configurations: defaultEquipmentConfigurations, quantitative: defaultEquipmentQuantitative };
  return loadEquipmentSettings();
}

export async function publishEquipmentSettings(configurations: EquipmentConfigurations, modulePrices: EquipmentModulePrices, quantitative: EquipmentQuantitativeSettings, expectedRevision: number, actor: string) {
  await ensureTable();
  const sql = database();
  const [row] = await sql`INSERT INTO pv_equipment_configuration_versions(revision, configurations, module_prices, quantitative, msrp, actor_email)
    SELECT ${expectedRevision + 1}, ${JSON.stringify(configurations)}::jsonb, ${JSON.stringify(modulePrices)}::jsonb, ${JSON.stringify(quantitative)}::jsonb,
      (SELECT msrp FROM pv_equipment_configuration_versions ORDER BY revision DESC LIMIT 1), ${actor}
    WHERE (SELECT COALESCE(MAX(revision), 0) FROM pv_equipment_configuration_versions) = ${expectedRevision}
    ON CONFLICT (revision) DO NOTHING RETURNING revision, configurations, module_prices, quantitative, saved_at`;
  return row ? settings(row as Parameters<typeof settings>[0]) : null;
}
