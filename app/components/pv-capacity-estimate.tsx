"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PVCirculatorReference } from "./pv-circulator-route-data";
import type { OurSolutionLocale } from "../../lib/our-solution/market";

import { capacityCalendar, capacityDefaultFields, equipmentFieldValue, equipmentSchedule, type CapacityDefaults } from "../../lib/equipment-quantitative";

type LineRating = { panelsPerMinute: number; direct: number; support: number };
type Translate = (english: string) => string;

const { monthsPerYear, calendarHours } = capacityCalendar;

const labels = {
  days: "Operating days per year",
  shifts: "Shifts per day",
  hours: "Hours per shift",
  maintenance: "Planned maintenance outside work (hours/month)",
  inShiftMaintenance: "In-shift maintenance during work (hours/week)",
  uptime: "Uptime (%)",
  speed: "Operating speed (% of rated)",
} as const;

const fields = capacityDefaultFields.map(([key, , , min, max, step]) => ({ key, label: labels[key], min, max, step: step ?? "any" as const }));

type Field = typeof fields[number]["key"];

export const capacityEstimateId = "capacity-estimate";

export function showCapacityEstimate(focus = false) {
  const panel = document.getElementById(capacityEstimateId);
  panel?.scrollIntoView({ block: "start", behavior: "instant" });
  if (focus) panel?.querySelector("h3")?.focus({ preventScroll: true });
}

export function useCapacityEstimate(rating: LineRating, defaults: CapacityDefaults) {
  const [overrides, setCurrent] = useState<Partial<Record<Field, string>>>({});
  const current = Object.fromEntries(fields.map(({ key }) => [key, overrides[key] ?? String(defaults[key])])) as Record<Field, string>;
  const values = Object.fromEntries(fields.map(field => [field.key, current[field.key].trim() === "" ? NaN : Number(current[field.key])])) as Record<Field, number>;
  const { uptime, speed } = values;
  const { dailyHours, scheduledHours, calendarMaintenanceHours, scheduledMaintenanceHours, valid: validSchedule } = equipmentSchedule(values);
  const valid = validSchedule && capacityDefaultFields.every(field => equipmentFieldValue(field, values[field[0]]));
  const panelsPerHour = rating.panelsPerMinute * 60;
  const theoretical = calendarHours * panelsPerHour;
  const afterMaintenance = (calendarHours - calendarMaintenanceHours) * panelsPerHour;
  const availableCapacity = afterMaintenance * uptime / 100;
  const netAnnual = (scheduledHours - scheduledMaintenanceHours) * (uptime / 100) * (speed / 100) * panelsPerHour;
  const monthlyAverage = Math.round(netAnnual / monthsPerYear);
  return { current, setField: (key: Field, value: string) => setCurrent(current => ({ ...current, [key]: value })), valid, dailyHours, monthlyAverage, scheduledHours, theoretical, afterMaintenance, availableCapacity, netAnnual };
}

export function CapacityEstimate({ estimate, rating, shareThroughput, businessCaseHref, locale, t, reference, feeInput, setFeeInput, annualFeeRevenue }: {
  estimate: ReturnType<typeof useCapacityEstimate>;
  rating: LineRating;
  shareThroughput: boolean;
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

  const { current, setField, valid, scheduledHours, theoretical, afterMaintenance, availableCapacity, netAnnual, monthlyAverage } = estimate;
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
      <p>{t(shareThroughput
        ? "Economic, Basic and Premium share the same rated throughput. With PLUS integrated, line throughput is {throughput} panels/min."
        : "This estimate uses the Basic line’s rated throughput of {throughput} panels/min.").replace("{throughput}", rating.panelsPerMinute.toLocaleString(locale, { maximumFractionDigits: 2 }))}</p>
      <div className="pvc2-capacity-fields">
        {fields.map(field => <label key={field.key}>{t(field.label)}
          <input type="number" min={field.min} max={field.max} step={field.step} value={current[field.key]}
            aria-describedby={field.key === "uptime" ? "capacity-uptime-note" : field.key === "maintenance" || field.key === "inShiftMaintenance" ? "capacity-maintenance-note" : undefined}
            onChange={event => setField(field.key, event.currentTarget.value)} />
        </label>)}
        {reference && <label>{t("Recycling fee")} ({reference.feeUnit})
          <input type="number" min="0" step="any" value={feeInput} required
            onChange={event => setFeeInput(event.currentTarget.value)} />
        </label>}
      </div>
      <p id="capacity-maintenance-note" className="pv-note">{t("Planned maintenance reduces scheduled output only with three shifts per day. In-shift maintenance always reduces scheduled output.")}</p>
      <p id="capacity-uptime-note" className="pv-note">{t("Uptime accounts for unplanned downtime after scheduled maintenance hours are deducted.")}</p>
      <div aria-live="polite">
        {!valid ? <p>{t("Check the input ranges, the 24-hour daily limit, and that maintenance fits the available hours.")}</p> : <>
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
