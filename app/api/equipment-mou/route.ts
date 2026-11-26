import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { equipmentInquiryMaterials, equipmentInquiryNotesLimit, equipmentMouHasSalesAgent, equipmentMouSigningLocales, equipmentOfftakeStreams, equipmentProjectStages, equipmentPurchaseOptions, equipmentVariants, glassOfftakePrices, otherSitePowerSupply, polymerOfftakeOptions, siteNetworkOptions, type EquipmentMou, type EquipmentMouInput, type EquipmentMouContact, type EquipmentMouReview } from "../../../lib/equipment-mou";
import { isSitePowerOption } from "../../../lib/equipment-quantitative";
import { ourSolutionLocales, ourSolutionParameterMarkets, publicSolutionMarkets } from "../../../lib/our-solution/market";
import { model } from "../../../lib/our-solution/model";
import { parameterCurrency, scenarioPanelWeightKg, scenarioPanelWeightLb } from "../../../lib/our-solution/parameters";
import { equipmentMouGoverningLaw } from "../../../lib/equipment-mou-articles";
import { equipmentInquiryTranslate, inquiryText } from "../../../lib/equipment-mou-copy";
import { mailConfigured, sendDocumentEmail } from "../../../server/delivery/communications";
import { jsonBody, reply, sameOrigin } from "../../../server/delivery/http";
import { limit } from "../../../server/delivery/limits";
import { loadSolutionOperatingData } from "../../../server/our-solution/public-view";

import { equipmentMouMarket, equipmentMouSalesTerms } from "../../../server/equipment-mou/market";
import { completeMsrpDetails, consumeMsrpCode, isWorkEmail, sendMsrpCode } from "../../../server/equipment-mou/msrp-verification";
import { parseInquirySubmission, recordInquirySubmission, recordVerifiedInquiryContact } from "../../../server/equipment-mou/submissions";
import { database } from "../../../server/db/client";

export const runtime = "nodejs";

function within(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function validOfftake({ offtakeStreams, glassOfftakePrice, installationMarket }: EquipmentMouInput) {
  if (offtakeStreams === undefined) return glassOfftakePrice === undefined;
  if (!Array.isArray(offtakeStreams) || offtakeStreams.length > equipmentOfftakeStreams.length
    || !offtakeStreams.every(stream => equipmentOfftakeStreams.includes(stream))
    || new Set(offtakeStreams).size !== offtakeStreams.length) return false;
  if (!offtakeStreams.includes("Glass")) return glassOfftakePrice === undefined;
  return installationMarket === "US" && (glassOfftakePrice === undefined || glassOfftakePrices.includes(glassOfftakePrice));
}

function validInput(value: EquipmentMouInput | null): value is EquipmentMouInput {
  return Boolean(value && equipmentVariants.includes(value.configuration)
    && (value.baseConfiguration === undefined || (equipmentVariants.slice(0, 3).includes(value.baseConfiguration)))
    && (value.purchaseOption === undefined || (equipmentPurchaseOptions.includes(value.purchaseOption)
      && (value.installationMarket !== "JP" || value.purchaseOption === equipmentPurchaseOptions[0])))
    && (value.polymerOfftake === undefined || polymerOfftakeOptions.includes(value.polymerOfftake))
    && publicSolutionMarkets.includes(value.installationMarket) && publicSolutionMarkets.includes(value.pageMarket)
    && ourSolutionLocales.includes(value.locale)
    && (value.sitePowerSupply === undefined || value.sitePowerSupply === otherSitePowerSupply
      || isSitePowerOption(value.sitePowerSupply))
    && (value.installationSite === undefined || validContactField(value.installationSite, 240))
    && (value.installationPostalCode === undefined || validContactField(value.installationPostalCode, 16))
    && (value.targetStart === undefined || validMonth(value.targetStart))
    && (value.targetAssessment === undefined || validMonth(value.targetAssessment))
    && (value.projectStage === undefined || equipmentProjectStages.includes(value.projectStage))
    && (value.customization === undefined || validNotes(value.customization))
    && (value.panelTechnology === undefined || value.panelTechnology === "Crystalline silicon")
    && (value.panelCondition === undefined || ["Not yet determined", "Mostly intact", "Mostly damaged", "Mixed"].includes(value.panelCondition))
    && validMaterialRequirements(value.materialRequirements)
    && validOfftake(value)
    && (value.installationEnvironment === undefined || ["Not yet determined", "Indoor", "Outdoor"].includes(value.installationEnvironment))
    && (value.floorArea === undefined || (value.floorArea && within(value.floorArea.value, 0, Number.MAX_SAFE_INTEGER)
      && ["m2", "ft2"].includes(value.floorArea.unit)))
    && (value.interfaceLanguage === undefined || ["English", "Japanese"].includes(value.interfaceLanguage))
    && (value.compressedAir === undefined || ["Not yet determined", "Available", "Not available"].includes(value.compressedAir))
    && (value.siteNetwork === undefined || [...siteNetworkOptions, "Not yet determined", "Wired Ethernet and Wi-Fi"].includes(value.siteNetwork))
    && (value.installationNotes === undefined || validNotes(value.installationNotes))
    && Number.isSafeInteger(value.lines) && within(value.lines, 1, 10_000)
    && (value.panelsPerMonth === null || within(value.panelsPerMonth, 0, 1e9))
    && (value.dailyHours === null || within(value.dailyHours, 0.25, 24))
    && (value.recyclingFee === null || within(value.recyclingFee, 0, Number.MAX_SAFE_INTEGER)));
}

async function estimate(input: EquipmentMouInput, msrpPerLine: number | null): Promise<EquipmentMou> {
  const currency = ourSolutionParameterMarkets[input.installationMarket].currency;
  const msrpTotal = msrpPerLine === null ? null : msrpPerLine * input.lines;
  const result: EquipmentMou = {
    currency, msrpPerLine, msrpTotal, investment: msrpTotal,
    annualEbitda: null, paybackYears: null, capacityExceeded: false,
  };
  if (!input.panelsPerMonth || !input.dailyHours) return result;
  const source = await loadSolutionOperatingData(input.installationMarket);
  if (!source || parameterCurrency(source.data) !== currency) return result;
  const { data, prices } = source;
  const scenario = { ...data.scenario, panels_per_month: input.panelsPerMonth, operating_hours_per_day: input.dailyHours };
  const output = model({ ...data, scenario }, prices, { circulatorLines: input.lines }).solutions.PVCIRCULATOR;
  if (output.lines > input.lines) {
    result.capacityExceeded = true;
    return result;
  }
  const feeOverride = input.pageMarket === input.installationMarket ? input.recyclingFee : null;
  const fee = feeOverride === null ? output.perPanel.processingRevenue
    : feeOverride * (String(data.assumptions[11]["Recovery fee"][1]).endsWith("/lb")
      ? scenarioPanelWeightLb(data) : scenarioPanelWeightKg(data));
  const annualEbitda = output.ebitda + fee * input.panelsPerMonth * 12;
  if (Number.isFinite(annualEbitda)) result.annualEbitda = annualEbitda;
  if (result.investment !== null && result.annualEbitda !== null && result.annualEbitda > 0)
    result.paybackYears = result.investment / result.annualEbitda;
  return result;
}

function validMaterialRequirements(rows: EquipmentMouInput["materialRequirements"]) {
  return rows === undefined || (Array.isArray(rows) && rows.length <= equipmentInquiryMaterials.length
    && rows.every(row => row && equipmentInquiryMaterials.includes(row.material)
      && (row.minimumPurity === null || within(row.minimumPurity, 0, 100)))
    && new Set(rows.map(row => row.material)).size === rows.length);
}

function validNotes(value: unknown) {
  return typeof value === "string" && value.length <= equipmentInquiryNotesLimit
    && !/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value);
}

function validContactField(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length <= max && !/[\r\n\x00-\x1f]/.test(value);
}

function validMonth(value: unknown) {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

const emailPattern = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const consentVersion = 15;

function validContact(contact: EquipmentMouContact | undefined): contact is EquipmentMouContact {
  return Boolean(contact && validContactField(contact.name, 120) && contact.name.trim()
    && validContactField(contact.company, 160) && contact.company.trim()
    && (contact.address === undefined || validContactField(contact.address, 240))
    && (contact.phone === undefined || validContactField(contact.phone, 80))
    && validContactField(contact.jobTitle, 120)
    && validContactField(contact.email, 254) && emailPattern.test(contact.email));
}

function signature(review: Omit<EquipmentMouReview, "token">, id: string, expires: number) {
  const key = process.env.AUTH_SECRET;
  return key && key.length >= 32
    ? createHmac("sha256", key).update(JSON.stringify([`equipment-mou-preview-v2-${consentVersion}`, id, expires, review.input, review.contact, review.mou, review.terms])).digest("hex")
    : null;
}

function verifiedReview(review: EquipmentMouReview | undefined): review is EquipmentMouReview & { token: NonNullable<EquipmentMouReview["token"]> } {
  const token = review?.token;
  if (!review || !token || typeof token.id !== "string" || !uuidPattern.test(token.id)
    || typeof token.signature !== "string" || !/^[0-9a-f]{64}$/.test(token.signature)
    || !Number.isSafeInteger(token.expires) || token.expires < Date.now()
    || !validInput(review.input) || !validContact(review.contact) || !review.terms?.governingLaw) return false;
  const wanted = signature(review, token.id, token.expires);
  return wanted !== null && timingSafeEqual(Buffer.from(wanted, "hex"), Buffer.from(token.signature, "hex"));
}

function issueReview(review: Omit<EquipmentMouReview, "token">, deadline = Date.now() + 60 * 60 * 1000, id: string = randomUUID()) {
  const digest = signature(review, id, deadline);
  return reply({ review: { ...review, token: digest ? { id, expires: deadline, signature: digest } : null } });
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));

let signingStoreReady: Promise<void> | undefined;

function initializeSigningStore() {
  signingStoreReady ??= (async () => {
    const sql = database();
    await sql`CREATE TABLE IF NOT EXISTS pv_equipment_mou_acceptances (
      id uuid PRIMARY KEY, document jsonb NOT NULL,
      signed_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
    )`;
    await sql`ALTER TABLE pv_equipment_mou_acceptances ADD COLUMN IF NOT EXISTS completed_at timestamptz`;
  })().catch(error => {
    signingStoreReady = undefined;
    throw error;
  });
  return signingStoreReady;
}

export async function GET(request: Request) {
  const value = new URL(request.url).searchParams.get("market");
  const market = publicSolutionMarkets.find(option => option === value);
  if (!market) return reply({ error: "invalid_market" }, 400);
  try {
    return reply({ throughSalesAgent: equipmentMouHasSalesAgent(await equipmentMouSalesTerms(market)) });
  } catch {
    return reply({ error: "unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "invalid_origin" }, 403);
  let body;
  try { body = await jsonBody(request, 32768); }
  catch { return reply({ error: "invalid_request" }, 400); }
  try {
    const incomplete = body?.action === "record-incomplete";
    let submissionId: string | undefined;
    if (incomplete || (body?.action === "review" && body.submission !== undefined)) {
      const submission = parseInquirySubmission(body.submission);
      if (!submission) return reply({ error: "invalid_request" }, 400);
      if (!(await limit(request, "equipment-inquiry-submission", 30, 3600))) {
        return reply({ error: "too_many_requests" }, 429);
      }
      const formComplete = !incomplete && validInput(body.input) && validContact(body.contact);
      submissionId = await recordInquirySubmission(submission, formComplete);
      if (incomplete) return reply({ recorded: true }, 201);
    }
    if (body?.action === "review") {
      if (!validInput(body.input) || !validContact(body.contact)) return reply({ error: "invalid_request" }, 400);
      const input: EquipmentMouInput = body.input;
      const contact: EquipmentMouContact = body.contact;
      const intent = body.msrp?.intent;
      if (body.msrp !== undefined && intent !== "send" && intent !== "verify")
        return reply({ error: "invalid_request" }, 400);
      if (intent && !(await limit(request, "equipment-msrp-" + intent, intent === "send" ? 10 : 30, 3600)))
        return reply({ error: "too_many_requests" }, 429);
      const marketData = await equipmentMouMarket(input);
      if (!marketData) return reply({ error: "invalid_site_power" }, 400);
      const { terms } = marketData;
      let msrpPerLine: number | null = null;
      if (intent && input.installationMarket !== "JP" && !equipmentMouHasSalesAgent(terms)) {
        if (!completeMsrpDetails(input)) return reply({ error: "msrp_details_required" }, 422);
        if (!isWorkEmail(contact.email)) return reply({ error: "work_email_required" }, 422);
        if (marketData.msrpPerLine === null) return reply({ error: "msrp_not_published" }, 422);
        if (intent === "send") {
          const id = await sendMsrpCode(contact, input.locale);
          if (!id) return reply({ error: "msrp_email_cooldown" }, 429);
          return reply({ challenge: { id, email: contact.email } }, 202);
        }
        if (!(await consumeMsrpCode(contact, body.msrp.id, body.msrp.code)))
          return reply({ error: "msrp_code_invalid" }, 422);
        await recordVerifiedInquiryContact(submissionId, contact, [
          ["installationCountry", input.installationMarket],
          ["installationSite", input.installationSite ?? ""],
          ["installationPostalCode", input.installationPostalCode ?? ""],
          ["configuration", input.baseConfiguration ?? input.configuration],
          ["includePlus", input.configuration === "plus" ? "With" : "Without"],
          ["purchaseOption", input.purchaseOption ?? ""],
          ["lineQuantity", String(input.lines)],
        ]);
        msrpPerLine = marketData.msrpPerLine;
      }
      return issueReview({ input, contact, mou: await estimate(input, msrpPerLine), terms });
    }
    const submittedReview: EquipmentMouReview | undefined = body?.review;
    if (body?.action === "signing-version") {
      if (!verifiedReview(submittedReview)) return reply({ error: "expired_review" }, 409);
      const { input, contact, mou, terms, token } = submittedReview;
      const localizedInput = { ...input, locale: equipmentMouSigningLocales[input.pageMarket] };
      return issueReview({ input: localizedInput, contact, mou,
        terms: { ...terms, governingLaw: equipmentMouGoverningLaw(localizedInput) } }, token.expires, token.id);
    }
    if (body?.action !== "sign" || body.confirmed !== true) return reply({ error: "invalid_request" }, 400);
    if (!verifiedReview(submittedReview) || submittedReview.input.locale !== equipmentMouSigningLocales[submittedReview.input.pageMarket])
      return reply({ error: "expired_review" }, 409);
    const { input, contact, mou, terms, token } = submittedReview;
    const sql = database();
    await initializeSigningStore();
    let [record] = await sql`SELECT signed_at, completed_at FROM pv_equipment_mou_acceptances WHERE id=${token.id}::uuid`;
    const content = inquiryText(input, mou, contact, terms);
    if (!record) {
      if (!(await limit(request, "equipment-mou-sign", 3, 3600))) return reply({ error: "too_many_requests" }, 429);
      const document = JSON.stringify({ input, contact, mou, terms, content, consentVersion });
      [record] = await sql`INSERT INTO pv_equipment_mou_acceptances(id, document)
        VALUES (${token.id}::uuid, ${document}::jsonb) ON CONFLICT(id) DO NOTHING RETURNING signed_at, completed_at`;
      if (!record) [record] = await sql`SELECT signed_at, completed_at FROM pv_equipment_mou_acceptances WHERE id=${token.id}::uuid`;
    }
    if (record.completed_at) return reply({ signedAt: new Date(record.completed_at).toISOString(), mail: "accepted" });
    if (!mailConfigured()) return reply({ signedAt: null, mail: "unavailable" });
    const buyerConfirmedAt = new Date(record.signed_at).toISOString();
    const t = equipmentInquiryTranslate(input.locale);
    const articles = content.articles.map(article => {
      const introduction = article.introduction ? `<p>${escapeHtml(article.introduction)}</p>` : "";
      const body = article.table
        ? '<table style="width:100%;border-collapse:collapse"><tbody>' + article.table.map(([label, value]) =>
          `<tr><th scope="row" style="width:44%;text-align:start;vertical-align:top;padding:8px;border-bottom:1px solid #ddd">${escapeHtml(label)}</th>`
          + `<td style="text-align:end;vertical-align:top;padding:8px;border-bottom:1px solid #ddd">${escapeHtml(value).replace(/\r\n?|\n/g, "<br>")}</td></tr>`
        ).join("") + "</tbody></table>"
        : "<ol>" + article.items.map(item => `<li>${item.map(text => `<p>${escapeHtml(text)}</p>`).join("")}</li>`).join("") + "</ol>";
      const note = article.note ? `<p>${escapeHtml(article.note)}</p>` : "";
      return `<h2>${escapeHtml(article.title)}</h2>${introduction}${body}${note}`;
    }).join("");
    const status = [content.dispatchStatus, `${content.buyerConfirmationLabel}  ${buyerConfirmedAt}`, `${t("MOU reference")}  ${token.id}`].map(escapeHtml).join("<br>");
    try {
      const acceptedAt = await sendDocumentEmail(token.id, contact.email, {
        subject: `PV Circulator · ${content.title}`,
        html: `<h1>${escapeHtml(content.title)}</h1><p>${escapeHtml(content.description)}</p>${articles}<p>${status}</p>`,
      });
      const [completed] = await sql`UPDATE pv_equipment_mou_acceptances
        SET completed_at=COALESCE(completed_at,${acceptedAt}::timestamptz)
        WHERE id=${token.id}::uuid RETURNING completed_at`;
      return reply({ signedAt: new Date(completed.completed_at).toISOString(), mail: "accepted" });
    } catch (error) {
      return reply({ signedAt: null, mail: error instanceof Error && error.message === "send_in_progress" ? "pending" : "unavailable" });
    }
  } catch {
    return reply({ error: "unavailable" }, 503);
  }
}
