import type { QuoteLine } from "./batch-quote";
import {
  formatDocumentDate,
  quotationContactFromText,
  quotationLineViews,
  type QuotationContactView,
  type QuotationDocumentLike,
} from "./quotation-document";
import { pricingProfiles, type PricingSnapshot } from "./pricing-rules";

type Charge = { label: string; amount: number | null };
type FreightBreakdown = {
  baseAmount?: number | null;
  knownSubtotal?: number;
  services?: Charge[];
  pending?: string[];
};
export type OrderEmailDetails = {
  id: string;
  deliveryMethod: "self" | "pickup";
  bookings: { date: string; period: string; vehicle: string; count: number }[];
  freightTotal: number | null;
  freightBreakdown?: FreightBreakdown | null;
  contact?: QuotationContactView | null;
  originAddress?: Record<string, string> | null;
};
export type PickupEmailDetails = {
  id: string;
  distanceMiles: number;
  breakdown: FreightBreakdown;
};

type Input = {
  document: QuotationDocumentLike;
  lines: QuoteLine[];
  pricing: PricingSnapshot;
  processingTotal: number | null;
  recipient: string;
  order?: OrderEmailDetails | null;
  pickup?: PickupEmailDetails | null;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const currency = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "Pending review"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
const td = (value: unknown, style = "") =>
  `<td style="padding:11px 10px;border-bottom:1px solid #d8d9d7;vertical-align:top;${style}">${escapeHtml(value)}</td>`;

export function quotationEmail(input: Input) {
  const { document, lines, pricing, processingTotal, order, pickup } = input;
  const profile=pricing.profile??pricingProfiles.US;
  const currency=(value:number|null|undefined)=>value===null||value===undefined?'Pending review':new Intl.NumberFormat(profile.locale,{style:'currency',currency:profile.currency,maximumFractionDigits:profile.currency==='JPY'?0:2}).format(value);
  const data = quotationLineViews(lines, pricing);
  const contact = order?.contact ?? quotationContactFromText(document.text) ?? {
    name: "Customer",
    email: input.recipient,
  };
  const kind = order ? "Recycling order request" : pickup ? "Pickup quotation" : "Recycling quotation";
  const reference = order?.id ?? pickup?.id ?? document.id;
  const subject = `PV Circonomy ${kind.toLowerCase()} ${reference}`;
  const itemRows = data.rows.map((row) => `<tr>
    <td class="pv-item-index" style="padding:11px 10px;border-bottom:1px solid #d8d9d7;vertical-align:top;width:34px;color:#666;">${escapeHtml(row.item)}</td>
    <td style="padding:11px 10px;border-bottom:1px solid #d8d9d7;vertical-align:top;"><strong style="display:block;color:#151719;">${escapeHtml(row.description)}</strong><span style="display:block;margin-top:4px;color:#555b5e;font-size:12px;line-height:1.45;">${escapeHtml(row.specifications.join(" · "))}</span></td>
    ${td(row.quantity.toLocaleString("en-US"), "width:58px;text-align:right;white-space:nowrap;")}
    ${td(row.rate, "width:105px;text-align:right;white-space:nowrap;")}
    ${td(row.amount, `width:112px;text-align:right;font-weight:700;white-space:nowrap;${row.pending ? "color:#8a6500;" : ""}`)}
  </tr>`).join("");

  const customer = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;border-top:1px solid #d8d9d7;border-bottom:1px solid #d8d9d7;"><tr>
    <td style="padding:16px 0;width:50%;vertical-align:top;"><span style="display:block;color:#686d70;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">Prepared for</span><strong style="display:block;margin-top:5px;">${escapeHtml(contact.name)}</strong>${contact.company ? `<span style="display:block;">${escapeHtml(contact.company)}</span>` : ""}</td>
    <td style="padding:16px 0;width:50%;vertical-align:top;"><span style="display:block;color:#686d70;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">Contact</span><span style="display:block;margin-top:5px;">${escapeHtml(contact.email)}</span>${contact.phone ? `<span style="display:block;">${escapeHtml(contact.phone)}</span>` : ""}</td>
  </tr></table>`;

  const totals = `<table role="presentation" align="right" cellspacing="0" cellpadding="0" style="width:330px;max-width:100%;margin:18px 0 28px auto;border-collapse:collapse;">
    ${data.discount > 0 ? `<tr><td>Batch quantity discount</td><td style="text-align:right;">−${currency(data.discount)}</td></tr>` : ""}
    ${data.minimumAdjustment > 0 ? `<tr><td>Minimum processing fee adjustment</td><td style="text-align:right;">${currency(data.minimumAdjustment)}</td></tr>` : ""}
    ${data.pending ? `<tr><td style="padding:8px 0;color:#555b5e;">Priced items subtotal</td><td style="padding:8px 0;text-align:right;">${currency(data.subtotal)}</td></tr>` : ""}
    <tr><td style="padding:12px 0;border-top:2px solid #151719;font-weight:700;">${data.pending ? "Processing total" : "Total processing charges"}</td><td style="padding:12px 0;border-top:2px solid #151719;text-align:right;font-size:20px;font-weight:700;">${currency(processingTotal)}</td></tr>
  </table>`;

  const bookings = order?.bookings?.length ? `<h2 style="margin:30px 0 10px;font-size:18px;">Requested delivery windows</h2><table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:13px;"><thead><tr style="background:#151719;color:#fff;"><th align="left" style="padding:9px 10px;">Date</th><th align="left" style="padding:9px 10px;">Period</th><th align="left" style="padding:9px 10px;">Vehicle</th><th align="right" style="padding:9px 10px;">Count</th></tr></thead><tbody>${order.bookings.map((booking) => `<tr>${td(booking.date)}${td(booking.period === "am" ? "Morning" : "Afternoon")}${td(booking.vehicle)}${td(booking.count, "text-align:right;")}</tr>`).join("")}</tbody></table>` : "";

  const breakdown = order?.freightBreakdown ?? pickup?.breakdown;
  const transportRows: Charge[] = breakdown
    ? [{ label: "Base pickup transportation", amount: breakdown.baseAmount ?? null }, ...(breakdown.services ?? [])]
    : order
      ? [{ label: "Transportation", amount: order.deliveryMethod === "self" ? null : order.freightTotal }]
      : [];
  const transportKnownSubtotal = order?.deliveryMethod === "self"
    ? null
    : breakdown?.knownSubtotal ?? order?.freightTotal ?? null;
  const combinedKnownTotal = processingTotal !== null && transportKnownSubtotal !== null
    ? processingTotal + transportKnownSubtotal
    : null;
  const transportTotal = combinedKnownTotal !== null
    ? `<tr><td style="padding:13px 10px;border-top:2px solid #151719;font-weight:700;">${breakdown?.pending?.length ? "Known charges subtotal" : "Total before applicable taxes"}</td><td style="padding:13px 10px;border-top:2px solid #151719;text-align:right;font-size:17px;font-weight:700;">${escapeHtml(currency(combinedKnownTotal))}</td></tr>`
    : "";
  const transport = order || pickup ? `<h2 style="margin:30px 0 10px;font-size:18px;">${order ? "Delivery & transportation" : "Pickup transportation"}</h2>
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:13px;"><tbody>
      ${order ? `<tr>${td("Delivery method")}${td(order.deliveryMethod === "self" ? "Customer-arranged delivery" : "PV Circonomy pickup", "text-align:right;font-weight:700;")}</tr>` : ""}
      ${pickup ? `<tr>${td("Road miles per vehicle")}${td(pickup.distanceMiles.toLocaleString("en-US"), "text-align:right;font-weight:700;")}</tr>` : ""}
      ${transportRows.map((charge) => `<tr>${td(charge.label)}${td(order?.deliveryMethod === "self" && charge.label === "Transportation" ? "Customer arranged" : currency(charge.amount), "text-align:right;font-weight:700;")}</tr>`).join("")}
      ${transportTotal}
    </tbody></table>
    ${breakdown?.pending?.length ? `<div style="margin:12px 0;padding:12px 14px;background:#fff8dc;border:1px solid #e8cf6a;"><strong>Pending confirmation</strong><ul style="margin:7px 0 0;padding-left:20px;">${breakdown.pending.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}` : "";

  const address = order?.originAddress
    ? Object.values(order.originAddress).filter(Boolean).join(", ")
    : "";
  const orderSummary = order ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;background:#f4f5f1;"><tr><td style="padding:16px;"><strong style="display:block;">Order request ${escapeHtml(order.id)}</strong><span style="display:block;margin-top:4px;color:#555b5e;">Pending company confirmation${address ? ` · Pickup from ${escapeHtml(address)}` : ""}</span></td></tr></table>` : "";

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>@media(max-width:620px){.pv-shell{padding:18px!important}.pv-meta td{display:block!important;width:100%!important;padding:4px 0!important}.pv-items{font-size:11px!important}.pv-items th,.pv-items td{padding:8px 5px!important}.pv-item-index{display:none!important}}</style></head><body style="margin:0;background:#f1f2ef;color:#151719;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 10px;"><table class="pv-shell" role="presentation" width="760" cellspacing="0" cellpadding="0" style="width:100%;max-width:760px;background:#fff;padding:34px;">
      <tr><td><table role="presentation" width="100%"><tr><td style="vertical-align:top;"><strong style="font-size:22px;">PV Circonomy</strong><span style="display:block;width:44px;height:3px;margin-top:9px;background:#f4c526;"></span></td><td align="right" style="vertical-align:top;"><strong style="display:block;font-size:20px;">${escapeHtml(kind)}</strong><span style="color:#555b5e;">${escapeHtml(reference)}</span></td></tr></table></td></tr>
      <tr><td><table class="pv-meta" role="presentation" width="100%" style="margin-top:26px;color:#555b5e;font-size:12px;"><tr><td style="width:33%;">Issued<br><strong style="color:#151719;">${escapeHtml(formatDocumentDate(document.issued))}</strong></td><td style="width:33%;">Valid until<br><strong style="color:#151719;">${escapeHtml(formatDocumentDate(document.expires))}</strong></td><td style="width:34%;">Currency<br><strong style="color:#151719;">${profile.currency}</strong></td></tr></table></td></tr>
      <tr><td>${customer}${orderSummary}<table class="pv-items" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:13px;"><thead><tr style="background:#151719;color:#fff;"><th class="pv-item-index" align="left" style="padding:10px;">#</th><th align="left" style="padding:10px;">Description</th><th align="right" style="padding:10px;">Qty</th><th align="right" style="padding:10px;">Rate</th><th align="right" style="padding:10px;">Amount</th></tr></thead><tbody>${itemRows}</tbody></table>${totals}${bookings}${transport}
      <div style="clear:both;margin-top:32px;padding-top:18px;border-top:1px solid #d8d9d7;color:#555b5e;font-size:12px;"><strong style="color:#151719;">Terms</strong><p style="margin:7px 0;">Processing charges only. Transportation and applicable taxes are separate unless shown above. Final charges are subject to receiving verification of panel model, quantity and condition.</p><p style="margin:7px 0;">${order ? "This order request remains subject to company confirmation." : "This quotation is valid for seven days and does not reserve receiving capacity or confirm acceptance."}</p></div>
      </td></tr></table></td></tr></table></body></html>`;
  return { subject, html };
}
