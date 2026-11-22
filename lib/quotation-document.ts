import {
  batchTotals,
  describeCondition,
  estimatedLineArea,
  estimatedLineWeight,
  money,
  rateMoney,
  resolvedPanelWatts,
  shipmentLabels,
  type QuoteLine,
} from "./batch-quote";
import type { PricingSnapshot } from "./pricing-rules";

export type QuotationDocumentLike = {
  id: string;
  issued?: string;
  expires?: string;
  text: string;
};

export type QuotationContactView = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
};

export type QuotationLineView = {
  item: number;
  description: string;
  specifications: string[];
  quantity: number;
  rate: string;
  amount: string;
  pending: boolean;
};

export function quotationContactFromText(text: string): QuotationContactView | null {
  const value = (label: string) =>
    text
      .split("\n")
      .find((line) => line.startsWith(label + ": "))
      ?.slice(label.length + 2)
      .trim() || "";
  const name = value("Prepared for");
  const email = value("Email");
  if (!name || !email) return null;
  return {
    name,
    email,
    company: value("Company") || undefined,
    phone: value("Phone") || undefined,
  };
}
export function quotationLineViews(
  lines: QuoteLine[],
  pricing: PricingSnapshot,
): { rows: QuotationLineView[]; subtotal: number; pending: number } {
  const totals = batchTotals(lines, pricing.rules, pricing.transport);
  return {
    subtotal: totals.subtotal,
    pending: totals.pending,
    rows: lines.map((line, index) => {
      const price = totals.prices[index];
      const model = line.selectedModel;
      const watts = resolvedPanelWatts(line, pricing.rules);
      const weight = estimatedLineWeight(line, pricing.rules);
      const area = estimatedLineArea(line, pricing.rules);
      const description = model
        ? `${model.manufacturer} ${model.model}`
        : line.mode === "dimensions"
          ? `${line.length} × ${line.width} ${line.dimensionUnit} solar panel`
          : watts
            ? `${watts.watts} W solar panel`
            : "Solar panel — details pending";
      const specifications = [
        watts ? `${watts.watts} W${watts.estimated ? " estimated" : ""}` : "Rated watts pending",
        describeCondition(line),
        shipmentLabels[line.scale],
        weight ? `${weight.kg.toLocaleString("en-US", { maximumFractionDigits: 3 })} kg / panel${weight.estimated ? " estimated" : ""}` : "Weight pending",
        area !== null ? `${area.toLocaleString("en-US", { maximumFractionDigits: 4 })} m² / panel` : "",
        price.qualificationNote || "",
      ].filter(Boolean);
      const rate =
        price.rate === undefined
          ? "Pending"
          : `${rateMoney(price.rate)} / ${price.unit === "lb" ? "lb" : "panel"}`;
      return {
        item: index + 1,
        description,
        specifications,
        quantity: Number(line.quantity),
        rate,
        amount: price.total === null ? "Pending review" : money(price.total),
        pending: price.total === null,
      };
    }),
  };
}

export function formatDocumentDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date) + " UTC";
}
