"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PVCirculatorReference } from "./pv-circulator-route-data";
import type { OurSolutionLocale } from "../../lib/our-solution/market";

type LineRating = { panelsPerMinute: number; direct: number; support: number };
type Translate = (english: string) => string;

const weeksPerYear = 52;

const fields = [
  { key: "days", label: "Operating days per year", initial: String(5 * weeksPerYear), max: 365, min: 1, step: 1 },
  { key: "shifts", label: "Shifts per day", initial: "1", max: 24, min: 1, step: 1 },
  { key: "hours", label: "Hours per shift", initial: "8", max: 24, min: 0.25, step: 0.25 },
  { key: "maintenance", label: "Planned maintenance hours per week", initial: "4", max: 168, min: 0, step: "any" },
  { key: "inShiftMaintenance", label: "In-shift maintenance hours per week", initial: "4", max: 168, min: 0, step: "any" },
  { key: "uptime", label: "Uptime (%)", initial: "85", max: 100, min: 0, step: "any" },
  { key: "speed", label: "Operating speed (% of rated)", initial: "85", max: 100, min: 0, step: "any" },
] as const;

type Field = typeof fields[number]["key"];

export const capacityEstimateId = "capacity-estimate";

export function showCapacityEstimate(focus = false) {
  const panel = document.getElementById(capacityEstimateId);
  panel?.scrollIntoView({ block: "start", behavior: "instant" });
  if (focus) panel?.querySelector("h3")?.focus({ preventScroll: true });
}

export function useCapacityEstimate(rating: LineRating) {
  const [current, setCurrent] = useState(() => Object.fromEntries(fields.map(field => [field.key, field.initial])) as Record<Field, string>);
  const values = Object.fromEntries(fields.map(field => [field.key, current[field.key].trim() === "" ? NaN : Number(current[field.key])])) as Record<Field, number>;
  const { days, shifts, hours, maintenance, inShiftMaintenance, uptime, speed } = values;
  const dailyHours = shifts * hours;
  const scheduledHours = days * dailyHours;
  const valid = fields.every(({ key, min, max, step }) => {
    const value = values[key];
    return Number.isFinite(value) && value >= min && value <= max && (step === "any" || Number.isInteger(value / step));
  }) && dailyHours <= 24 && inShiftMaintenance <= maintenance && inShiftMaintenance * weeksPerYear <= scheduledHours;
  const panelsPerHour = rating.panelsPerMinute * 60;
  const theoretical = 365 * 24 * panelsPerHour;
  const afterMaintenance = (365 * 24 - maintenance * weeksPerYear) * panelsPerHour;
  const availableCapacity = afterMaintenance * uptime / 100;
  const netAnnual = (scheduledHours - inShiftMaintenance * weeksPerYear) * (uptime / 100) * (speed / 100) * panelsPerHour;
  const monthlyAverage = Math.round(netAnnual / 12);
  return { current, setCurrent, valid, dailyHours, monthlyAverage, scheduledHours, theoretical, afterMaintenance, availableCapacity, netAnnual };
}

export function CapacityEstimate({ estimate, rating, businessCaseHref, locale, t, reference, feeInput, setFeeInput, annualFeeRevenue }: {
  estimate: ReturnType<typeof useCapacityEstimate>;
  rating: LineRating;
  businessCaseHref: string;
  locale: OurSolutionLocale;
  t: Translate;
  reference?: PVCirculatorReference;
  feeInput: string;
  setFeeInput: (value: string) => void;
  annualFeeRevenue: number | null;
}) {
  useEffect(() => {
    function scrollFromLink() {
      if (location.hash === `#${capacityEstimateId}`) showCapacityEstimate();
    }
    scrollFromLink();
    window.addEventListener("hashchange", scrollFromLink);
    return () => window.removeEventListener("hashchange", scrollFromLink);
  }, []);

  const { current, setCurrent, valid, scheduledHours, theoretical, afterMaintenance, availableCapacity, netAnnual, monthlyAverage } = estimate;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const annualCurrency = reference && new Intl.NumberFormat(locale, { style: "currency", currency: reference.currency, maximumFractionDigits: 0 });
  const results = [
    ["Calendar maximum", theoretical, "panels/year"],
    ["Calendar capacity after maintenance", afterMaintenance, "panels/year"],
    ["Calendar capacity after downtime", availableCapacity, "panels/year"],
    ["Estimated output on your schedule", netAnnual, "panels/year"],
    ["Average output over 12 months", monthlyAverage, "panels/month"],
  ] as const;

  return <section id={capacityEstimateId} className="pvc2-capacity" aria-labelledby="capacity-estimate-title">
    <div className="pvc2-capacity-content">
      <h3 id="capacity-estimate-title" tabIndex={-1}>{t("Capacity and staffing estimate")}</h3>
      <p>{t("Economic, Basic and Premium share the same rated throughput. With PLUS integrated, line throughput is {throughput} panels/min.").replace("{throughput}", rating.panelsPerMinute.toLocaleString(locale, { maximumFractionDigits: 2 }))}</p>
      <div className="pvc2-capacity-fields">
        {fields.map(field => <label key={field.key}>{t(field.label)}
          <input type="number" min={field.min} max={field.max} step={field.step} value={current[field.key]}
            aria-describedby={field.key === "uptime" ? "capacity-uptime-note" : undefined}
            onChange={event => setCurrent({ ...current, [field.key]: event.currentTarget.value })} />
        </label>)}
        {reference && <label>{t("Recycling fee")} ({reference.feeUnit})
          <input type="number" min="0" step="any" value={feeInput} required
            onChange={event => setFeeInput(event.currentTarget.value)} />
        </label>}
      </div>
      <p id="capacity-uptime-note" className="pv-note">{t("Uptime is the share of time available to run after planned maintenance, accounting for unplanned downtime.")}</p>
      <div aria-live="polite">
        {!valid ? <p>{t("Check the ranges, the 24-hour daily limit and the maintenance hours that fall within scheduled shifts.")}</p> : <>
          <dl className="pvc2-capacity-results">
            {results.map(([label, value, unit]) => <div key={label}><dt>{t(label)}</dt><dd>{number.format(value)} {t(unit)}</dd></div>)}
            {annualFeeRevenue !== null && <div><dt>{t("Annual recycling fee revenue")}</dt><dd>{annualCurrency?.format(annualFeeRevenue)}</dd></div>}
            <div><dt>{t("Direct operation")}</dt><dd>{rating.direct} {t("person/shift")} · {number.format(scheduledHours * rating.direct)} {t("person-hours/year")}</dd></div>
            <div><dt>{t("Indirect support")}</dt><dd>{rating.support} {t("people/shift")} · {number.format(scheduledHours * rating.support)} {t("person-hours/year")}</dd></div>
          </dl>
          <div className="pvc2-route-actions">
            {monthlyAverage > 0 && <Link className="pv-button" href={`${businessCaseHref}&panelsPerMonth=${monthlyAverage}#operation`}>{t("Use monthly output in Business Case")}</Link>}
            {annualFeeRevenue !== null && <a className="pv-text-button" href="#routes">{t("Compare recycling profit")}</a>}
          </div>
        </>}
      </div>
      <p className="pv-note">{t("Direct staff operate the equipment. Indirect staff handle warehousing and pre-processing. Include unplanned changeovers or cleaning stops in uptime.")}</p>
    </div>
  </section>;
}
