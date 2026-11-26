import { createHmac, randomInt, randomUUID } from "node:crypto";
import { equipmentVariants, type EquipmentMouContact, type EquipmentMouInput } from "../../lib/equipment-mou";
import { equipmentInquiryTranslate } from "../../lib/equipment-mou-copy";
import type { OurSolutionLocale } from "../../lib/our-solution/market";
import { database } from "../db/client";
import { mailConfigured, sendBusinessCaseMessage } from "../delivery/communications";

const postalPatterns = {
  US: /^\d{5}(?:-\d{4})?$/,
  CA: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
  AU: /^\d{4}$/,
  UK: /^(?:GIR ?0AA|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/i,
  // EU represents multiple countries with different formats.
  EU: /^(?=.*\d)[A-Z0-9]+(?:[ -][A-Z0-9]+)*$/i,
};

const personalDomains = [
  "gmail.com", "googlemail.com", "hotmail.com", "outlook.com", "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com", "yahoo.com", "ymail.com", "rocketmail.com", "aol.com",
  "proton.me", "protonmail.com", "pm.me", "gmx.com", "gmx.net", "gmx.de", "mail.com", "web.de",
  "fastmail.com", "tuta.com", "tutanota.com", "tutamail.com", "qq.com", "foxmail.com",
  "163.com", "126.com", "sina.com", "yandex.com", "yandex.ru", "mail.ru", "yeah.net",
  "naver.com", "daum.net", "hey.com", "duck.com", "simplelogin.com", "privaterelay.appleid.com",
  "mailinator.com", "guerrillamail.com", "yopmail.com", "10minutemail.com", "example.com",
  "example.net", "example.org", "example.invalid",
];

export function isWorkEmail(email: string) {
  const domain = email.trim().toLowerCase().split("@").at(-1) ?? "";
  const labels = domain.split(".");
  return domain.length <= 253 && labels.length > 1
    && labels.every(label => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/.test(label))
    && !/\.(?:invalid|test|example|localhost)$/.test(domain)
    && !personalDomains.some(provider => domain === provider || domain.endsWith("." + provider))
    && !/(?:^|\.)(?:yahoo|hotmail|outlook|live)\.(?:co|com)\.[a-z]{2}$/.test(domain)
    && !/(?:^|\.)(?:yahoo|hotmail|outlook|live)\.[a-z]{2}$/.test(domain);
}

export function completeMsrpDetails(input: EquipmentMouInput) {
  const { installationMarket, installationSite, installationPostalCode, configuration, baseConfiguration, lines } = input;
  if (installationMarket === "JP" || !installationSite?.trim()) return false;
  const postalCode = installationPostalCode?.trim() ?? "";
  return postalCode.length >= 3 && postalPatterns[installationMarket].test(postalCode)
    && (configuration === "plus" ? equipmentVariants.slice(0, 3).includes(baseConfiguration ?? "plus") : baseConfiguration === undefined)
    && Number.isSafeInteger(lines) && lines >= 1 && lines <= 10000;
}

let initialized: Promise<void> | undefined;

function initialize() {
  initialized ??= (async () => {
    const sql = database();
    await sql`CREATE TABLE IF NOT EXISTS pv_equipment_msrp_challenges (
      email_key text PRIMARY KEY,
      id uuid NOT NULL,
      code_hash text NOT NULL,
      issued_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL,
      attempts integer NOT NULL DEFAULT 0,
      used boolean NOT NULL DEFAULT false
    )`;
    await sql`CREATE INDEX IF NOT EXISTS pv_equipment_msrp_challenges_expiry ON pv_equipment_msrp_challenges(expires_at)`;
  })().catch(error => {
    initialized = undefined;
    throw error;
  });
  return initialized;
}

function digest(...parts: string[]) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("msrp_verification_unavailable");
  return createHmac("sha256", secret).update(JSON.stringify(["equipment-msrp", ...parts])).digest("hex");
}

function emailDigest(email: string) {
  const [address, domain] = email.split("@");
  return digest("email", address.split("+")[0] + "@" + domain);
}

function codeDigest(contact: EquipmentMouContact, id: string, code: string) {
  return digest("code", contact.email.trim().toLowerCase(), contact.company.trim(), contact.name.trim(), id, code);
}

export async function sendMsrpCode(contact: EquipmentMouContact, locale: OurSolutionLocale) {
  if (!mailConfigured()) throw new Error("msrp_verification_unavailable");
  const emailKey = emailDigest(contact.email.trim().toLowerCase());
  const id = randomUUID();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const hash = codeDigest(contact, id, code);
  await initialize();
  const sql = database();
  await sql`DELETE FROM pv_equipment_msrp_challenges WHERE expires_at < now()`;
  const [claimed] = await sql`INSERT INTO pv_equipment_msrp_challenges
    (email_key, id, code_hash, expires_at) VALUES (${emailKey}, ${id}::uuid, ${hash}, now() + interval '10 minutes')
    ON CONFLICT (email_key) DO UPDATE SET id = EXCLUDED.id, code_hash = EXCLUDED.code_hash, issued_at = now(),
      expires_at = EXCLUDED.expires_at, attempts = 0, used = false
    WHERE pv_equipment_msrp_challenges.issued_at <= now() - interval '1 minute'
    RETURNING id`;
  if (!claimed) return null;
  const t = equipmentInquiryTranslate(locale);
  await sendBusinessCaseMessage({
    subject: `PV Circulator · ${t("MSRP verification code")}`,
    body: { contentType: "Text", content: t("Your PV Circulator MSRP verification code is {code}. It expires in 10 minutes.").replace("{code}", code) },
    toRecipients: [{ emailAddress: { address: contact.email.trim() } }],
  }, []);
  return id;
}

export async function consumeMsrpCode(contact: EquipmentMouContact, id: unknown, code: unknown) {
  if (typeof id !== "string" || !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/.test(id)
    || typeof code !== "string" || !/^\d{6}$/.test(code)) return false;
  const emailKey = emailDigest(contact.email.trim().toLowerCase());
  const hash = codeDigest(contact, id, code);
  await initialize();
  const sql = database();
  const [result] = await sql`UPDATE pv_equipment_msrp_challenges
    SET attempts = attempts + 1, used = (code_hash = ${hash})
    WHERE email_key = ${emailKey} AND id = ${id}::uuid AND expires_at > now() AND attempts < 5 AND NOT used
    RETURNING used`;
  return result?.used === true;
}
