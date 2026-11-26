import type { QuoteLine } from "../../lib/batch-quote";
import {
  formatDocumentDate,
  quotationContactFromText,
  quotationLineViews,
  type QuotationContactView,
  type QuotationDocumentLike,
} from "../../lib/quotation-document";
import { pricingProfiles, type PricingSnapshot } from "../../lib/pricing-rules";

type Props = {
  document: QuotationDocumentLike;
  lines: QuoteLine[];
  pricing: PricingSnapshot;
  processingTotal: number | null;
  contact?: QuotationContactView | null;
};

const money = (value: number | null, pricing: PricingSnapshot) =>
  value === null
    ? "Pending review"
    : new Intl.NumberFormat((pricing.profile??pricingProfiles.US).locale, {
        style: "currency",
        currency: (pricing.profile??pricingProfiles.US).currency,
        maximumFractionDigits: (pricing.profile??pricingProfiles.US).currency==='JPY'?0:2,
      }).format(value);

export function QuotationDocument({
  document,
  lines,
  pricing,
  processingTotal,
  contact,
}: Props) {
  const data = quotationLineViews(lines, pricing);
  const customer = contact ?? quotationContactFromText(document.text);
  return (
    <section className="pa-document" aria-label={`Quotation ${document.id}`}>
      <header className="pa-document-header">
        <div>
          <strong>PV Circonomy</strong>
          <h3>Recycling quotation</h3>
        </div>
        <dl>
          <div><dt>Quotation</dt><dd>{document.id}</dd></div>
          <div><dt>Issued</dt><dd>{formatDocumentDate(document.issued)}</dd></div>
          <div><dt>Valid until</dt><dd>{formatDocumentDate(document.expires)}</dd></div>
          <div><dt>Currency</dt><dd>{(pricing.profile??pricingProfiles.US).currency}</dd></div>
        </dl>
      </header>
      {customer && (
        <section className="pa-document-customer" aria-label="Customer details">
          <h4>Prepared for</h4>
          <p><strong>{customer.name}</strong>{customer.company ? <><br />{customer.company}</> : null}</p>
          <p>{customer.email}{customer.phone ? <><br />{customer.phone}</> : null}</p>
        </section>
      )}
      <div className="pa-document-table-wrap">
        <table className="pa-document-table">
          <thead><tr><th scope="col">Item</th><th scope="col">Description</th><th scope="col">Qty</th><th scope="col">Rate</th><th scope="col">Amount</th></tr></thead>
          <tbody>{data.rows.map((row) => (
            <tr key={row.item}>
              <td>{row.item}</td>
              <td><strong>{row.description}</strong><span>{row.specifications.join(" · ")}</span></td>
              <td>{row.quantity.toLocaleString()}</td>
              <td>{row.rate}</td>
              <td className={row.pending ? "is-pending" : undefined}>{row.amount}</td>
            </tr>
          ))}</tbody>
          <tfoot>
            {data.discount > 0 && <tr><th colSpan={4}>Batch quantity discount</th><td>−{money(data.discount,pricing)}</td></tr>}
            {data.minimumAdjustment > 0 && <tr><th colSpan={4}>Minimum processing fee adjustment</th><td>{money(data.minimumAdjustment,pricing)}</td></tr>}
            {data.pending > 0 && <tr><th colSpan={4}>Priced items subtotal</th><td>{money(data.subtotal,pricing)}</td></tr>}
            <tr><th colSpan={4}>{data.pending > 0 ? "Processing total" : "Total processing charges"}</th><td>{processingTotal === null ? "Pending review" : money(processingTotal,pricing)}</td></tr>
          </tfoot>
        </table>
      </div>
      <div className="pa-document-terms">
        <h4>Terms</h4>
        <p>Processing charges only. Transportation and applicable taxes are separate. Final charges are subject to receiving verification of panel model, quantity and condition.</p>
        <p>This quotation is valid for seven days. It does not reserve delivery, submit an order request, take payment or confirm acceptance.</p>
      </div>
    </section>
  );
}
