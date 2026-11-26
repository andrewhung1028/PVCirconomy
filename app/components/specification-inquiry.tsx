"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { EquipmentFields, inquiryTranslate, type EquipmentPerformance } from "./marketing";
import { marketNames, type OurSolutionLocale, type PublicSolutionMarket } from "../../lib/our-solution/market";

export function SpecificationInquiry<Variant extends string>({ configuration, configurations, onConfigurationChange, performance, locale, market }: {
  configuration: Variant;
  configurations: ReadonlyArray<{ value: Variant; label: string }>;
  onConfigurationChange: (value: Variant) => void;
  performance: EquipmentPerformance | null;
  locale: OurSolutionLocale;
  market: PublicSolutionMarket;
}) {
  const t = inquiryTranslate(locale);
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const [review, setReview] = useState<[string, string][] | null>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    setReview(null);
    setComplete(false);
  }, [configuration]);

  useEffect(() => {
    if (review) reviewHeading.current?.focus();
  }, [review]);

  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const summary: [string, string][] = [];
    const labelFor = (name: string) => {
      const input = event.currentTarget.elements.namedItem(name);
      if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement)) return name;
      const label = input.labels?.[0];
      const visibleLabel = label ? Array.from(label.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent).join("").trim() : "";
      return (input.getAttribute("aria-label") ?? visibleLabel) || name;
    };
    for (const [name, raw] of data) {
      const value = String(raw).trim();
      if (!value || value === "Not yet determined" || ["floorSpaceUnit", "materials"].includes(name) || name.startsWith("materialPurity[")) continue;
      if (name === "configuration") summary.push([t("Equipment configuration"), configurations.find(option => option.value === value)?.label ?? value]);
      else if (name === "installationCountry") summary.push([labelFor(name), marketNames[locale][value as PublicSolutionMarket] ?? value]);
      else if (name === "floorSpace") summary.push([labelFor(name), `${value} ${data.get("floorSpaceUnit") === "ft2" ? "ft²" : "m²"}`]);
      else summary.push([labelFor(name), t(value)]);
    }
    const materials = data.getAll("materials");
    if (materials.length) summary.push([t("Recovered material requirements"), materials.map(material => {
      const purity = data.get(`materialPurity[${material}]`);
      return `${t(String(material))}${purity ? ` (≥${purity}%)` : ""}`;
    }).join(", ")]);
    setReview(summary);
    setComplete(false);
  }

  return <section className="pvc2-inquiry-pane" id="equipment-inquiry" aria-labelledby={id}>
    <h2 id={id} ref={heading} tabIndex={-1}>{t("Online inquiry")}</h2>
    <p className="pv-note">{t("Preview only. Use sample contact details.")}</p>
    <form className="pc-form" onSubmit={preview} hidden={Boolean(review)}>
      <fieldset className="pc-booking-fieldset">
        <legend className="pvc2-inquiry-configuration-legend">{t("Equipment configuration")}</legend>
        <div className="pc-form-pair">
          <label>{t("Configuration")}
            <select name="configuration" value={configuration}
              onChange={event => onConfigurationChange(event.currentTarget.value as Variant)}>
              {configurations.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>{t("Number of equipment lines")}<input type="number" name="lineQuantity" min="1" step="1" defaultValue={1} required /></label>
          <label>{t("Target start date")}<input type="month" name="startDate" /></label>
          <label>{t("Project stage")}<select name="stage" defaultValue="Not yet determined">{["Not yet determined", "Initial feasibility", "Planning a new facility", "Expanding an operation"].map(stage => <option key={stage} value={stage}>{t(stage)}</option>)}</select></label>
          {configuration === "plus" && <label className="pc-configuration-requirements">{t("Base configuration for PLUS")}
            <select name="plusBase" defaultValue="Not yet determined">
              {["Not yet determined", "Economic", "Basic", "Premium"].map(option => <option key={option} value={option}>{t(option)}</option>)}
            </select>
          </label>}
          <label className="pc-configuration-requirements">{t("Customization requirements")}<textarea name="configurationRequirements" rows={2} /></label>
        </div>
      </fieldset>
      <EquipmentFields locale={locale} market={market} specificationPerformance={performance} />
      <button className="pv-button pvc2-quote-button" type="submit">{t("Review inquiry")}</button>
    </form>
    {review && <div className="pvc2-inquiry-review">
      <h3 ref={reviewHeading} tabIndex={-1}>{t("Review inquiry")}</h3>
      <dl>{review.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <div className="pvc2-inquiry-review-actions">
        <button type="button" className="pv-button" onClick={() => { setReview(null); heading.current?.focus(); }}>{t("Edit details")}</button>
        <button type="button" className="pv-button pvc2-quote-button" disabled={complete} onClick={() => setComplete(true)}>{t("Preview submission")}</button>
      </div>
      {complete && <p role="status">{t("Preview complete. Your inquiry was not sent.")}</p>}
    </div>}
  </section>;
}
