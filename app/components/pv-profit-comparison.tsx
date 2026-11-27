"use client";

import Link from "next/link";
import { useState } from "react";
import { solutionHref, type OurSolutionLocale, type PublicSolutionMarket } from "../../lib/our-solution/market";
import { capacityEstimateId, showCapacityEstimate } from "./pv-capacity-estimate";
import { Arrow } from "./marketing";
import { EconomicLineChart } from "./economic-line-chart";
import type { PVCirculatorProfitRoute, PVCirculatorReference } from "./pv-circulator-route-data";

const methodLabels = {
  SHREDDING: "Shredding",
  HOT_KNIFE: "Thermal processing",
  PVCIRCULATOR: "PV Circulator",
};

const costLabels: Record<string, string> = {
  labor: "Labor",
  burden: "Payroll burden and workers’ compensation",
  facility: "Facility and storage",
  electricity: "Electricity",
  consumables: "Consumables",
  maintenance: "Maintenance",
  packaging: "Packaging",
  handling: "Forklift and handling",
  insurance: "Insurance and compliance",
  admin: "Facility utilities and administration",
  secondary: "Residue treatment or disposal",
};

type Translate = (english: string) => string;

const profitTabs = [
  ["comparison", "Profit per MW"],
  ["sensitivity", "Recycling fee sensitivity"],
] as const;

const reportingPeriods = [
  ["mw", "Per MW"],
  ["month", "Per month"],
  ["year", "Per year"],
] as const;

type ReportingPeriod = typeof reportingPeriods[number][0];

const feeLineClasses = {
  SHREDDING: "is-shredding",
  HOT_KNIFE: "is-thermal",
  PVCIRCULATOR: "is-circulator",
};

function formatFee(reference: PVCirculatorReference, fee: number, locale: OurSolutionLocale) {
  return new Intl.NumberFormat(locale, {
    style: "currency", currency: reference.currency, maximumFractionDigits: 8,
  }).format(fee) + reference.feeUnit.replace(/^[A-Z]{3}/, "");
}

function describeReference(reference: PVCirculatorReference, fee: number, locale: OurSolutionLocale, t: Translate) {
  const values = new Map([
    ["region", reference.region],
    ["monthly", Math.round(reference.panelsPerMonth).toLocaleString(locale)],
    ["watts", reference.panelWatts.toLocaleString(locale)],
    ["weight", `${reference.panelWeightKg.toLocaleString(locale)} kg`],
    ["fee", formatFee(reference, fee, locale)],
  ]);
  return t("Per MW of retired panels in the {region} scenario. Our Solution models {monthly} panels per month, {watts} W and {weight} per panel, with a recycling fee of {fee}.")
    .replace(/\{(\w+)\}/g, (placeholder, key) => values.get(key) ?? placeholder);
}

function FeeSensitivity({ routes, reference, feeRate, locale, t }: {
  routes: PVCirculatorProfitRoute[];
  reference: PVCirculatorReference;
  feeRate: number | null;
  locale: OurSolutionLocale;
  t: Translate;
}) {
  const steps = feeRate === null ? reference.feeSteps : [...new Set([...reference.feeSteps, feeRate])].sort((a, b) => a - b);
  const highlightIndex = feeRate === null ? undefined : steps.indexOf(feeRate);
  const annualPanels = reference.panelsPerMonth * 12;
  const annualMw = annualPanels * reference.panelWatts / 1e6;
  const annualFeeWeight = annualPanels * (reference.feeUnit.endsWith("/lb") ? reference.panelWeightLb : reference.panelWeightKg);
  const series = routes.map(route => {
    const opex = route.operatingCostsPerMw.reduce((sum, cost) => sum + cost.amount, 0);
    const baseProfit = (route.materialRevenuePerMw - opex) * annualMw;
    return {
      label: t(methodLabels[route.code]),
      className: feeLineClasses[route.code],
      values: steps.map(fee => Number(((baseProfit + fee * annualFeeWeight) / 1000).toFixed(3))),
    };
  });
  return <EconomicLineChart
    title={t("Recycling fee vs. annual EBITDA")}
    subtitle={`${t("Values in thousands of {currency}").replace("{currency}", reference.currency)} · ${reference.region} · ${Math.round(reference.panelsPerMonth).toLocaleString(locale)} ${t("panels/month")}`}
    labels={steps.map(fee => formatFee(reference, fee, locale))}
    series={series} highlightIndex={highlightIndex} currentLabel={t("Current fee")} numberLocale={locale}
  />;
}

export function ProfitComparison({ volumeQuery, routes, reference, feePerPanel, feeRate, locale, market, businessCaseHref, t }: {
  routes: PVCirculatorProfitRoute[];
  reference?: PVCirculatorReference;
  feePerPanel: number | null;
  feeRate: number | null;
  locale: OurSolutionLocale;
  market: PublicSolutionMarket;
  volumeQuery: string;
  businessCaseHref: string;
  t: Translate;
}) {
  const [tab, setTab] = useState<typeof profitTabs[number][0]>("comparison");
  const [selected, setSelected] = useState<PVCirculatorProfitRoute["code"]>("PVCIRCULATOR");
  const [period, setPeriod] = useState<ReportingPeriod>("year");
  const capacityHref = `#${capacityEstimateId}`;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const money = reference && new Intl.NumberFormat(locale, { style: "currency", currency: reference.currency, maximumFractionDigits: 0 });
  const periodFactor = reference && period !== "mw"
    ? reference.panelsPerMonth * reference.panelWatts / 1e6 * (period === "year" ? 12 : 1)
    : 1;
  const periodMoney = (amount: number) => money?.format(amount * periodFactor);
  const comparisons = routes.map(route => {
    const opex = route.operatingCostsPerMw.reduce((sum, cost) => sum + cost.amount, 0);
    const fee = reference && feePerPanel !== null ? feePerPanel * 1e6 / reference.panelWatts : null;
    return { ...route, opex, fee, profit: fee === null ? null : route.materialRevenuePerMw + fee - opex };
  });
  const active = comparisons.find(route => route.code === selected);
  const values = comparisons.map(route => route.profit ?? 0);
  const minimum = Math.min(0, ...values);
  const range = Math.max(0, ...values) - minimum || 1;
  const zero = -minimum / range * 100;

  return <section id="routes" className="pv-screen pvc2-routes os-method-comparison" aria-labelledby="routes-title">
    <div className="pvc2-profit-overview">
      <header className="pvc2-section-heading"><h2 id="routes-title">{t("Where the profit is.")}</h2></header>
      {reference ? <p>{describeReference(reference, feeRate ?? reference.processingFee, locale, t)}</p>
        : <p>{t("Reference-case metrics are currently unavailable. Run your business case to explore available regions.")}</p>}
      {reference && comparisons.length > 0 && <div className="os-deck-progress pvc2-profit-tabs" role="tablist" aria-label={t("Profit charts")}>
        {profitTabs.map(([key, label], index) => <button key={key} type="button" id={`pvc2-profit-tab-${key}`}
          role="tab" aria-selected={tab === key} aria-controls={`pvc2-profit-panel-${key}`} tabIndex={tab === key ? 0 : -1}
          onClick={() => setTab(key)} onKeyDown={event => {
            const next = event.key === "Home" ? 0 : event.key === "End" ? profitTabs.length - 1
              : event.key === "ArrowLeft" || event.key === "ArrowRight" ? (index + 1) % profitTabs.length : null;
            if (next === null) return;
            event.preventDefault();
            event.stopPropagation();
            setTab(profitTabs[next][0]);
            event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
          }}><span aria-hidden="true" /><small>{t(label)}</small></button>)}
      </div>}
      <div id="pvc2-profit-panel-comparison" role="tabpanel" aria-labelledby="pvc2-profit-tab-comparison" hidden={tab !== "comparison" || !reference}>
      {money && feeRate !== null && comparisons.length > 0 && <figure className="pvc2-profit-chart" aria-labelledby="pvc2-profit-chart-title">
        <figcaption>
          <strong id="pvc2-profit-chart-title">{t("Recycling EBITDA per MW")}</strong>
          <span>{t("Recycling fee")} · {feeRate.toLocaleString(locale, { maximumFractionDigits: 8 })} {reference?.feeUnit}</span>
        </figcaption>
        <div className="os-method-bars is-profit">{comparisons.map(route => {
          const value = route.profit ?? 0;
          return <button key={route.code} type="button" className={route.code === "PVCIRCULATOR" ? "is-circulator" : undefined} aria-pressed={route.code === selected}
            aria-controls="pvc2-profit-breakdown" onClick={() => setSelected(route.code)}>
            <span>{t(methodLabels[route.code])}</span>
            <span className="pvc2-profit-track" aria-hidden="true">
              {minimum < 0 && <b className="pvc2-profit-zero" style={{ left: `${zero}%` }} />}
              <i style={{
                left: `${(Math.min(0, value) - minimum) / range * 100}%`,
                width: `${Math.abs(value) / range * 100}%`,
              }} />
            </span>
            <strong>{money.format(value)}</strong>
          </button>;
        })}</div>
      </figure>}
      {reference && feeRate === null && <p>{t("Enter a valid recycling fee in Performance to compare profits.")}</p>}
      </div>
      {reference && comparisons.length > 0 && <div id="pvc2-profit-panel-sensitivity" className="pvc2-profit-sensitivity"
        role="tabpanel" aria-labelledby="pvc2-profit-tab-sensitivity" hidden={tab !== "sensitivity"}>
        {tab === "sensitivity" && <FeeSensitivity routes={routes} reference={reference} feeRate={feeRate} locale={locale} t={t} />}
      </div>}
      {reference && comparisons.length > 0 && <details className="pv-details pvc2-profit-environment">
        <summary>{t("Other recycling outcomes")}</summary>
        <div className="os-method-detail-table" role="region" aria-label={t("Other recycling outcomes")} tabIndex={0}><table>
          <thead><tr>
            <th scope="col">{t("Method")}</th>
            <th scope="col">{t("Process residue t/MW")}</th>
            <th scope="col">{t("Process CO2e t/MW")}</th>
            <th scope="col">{t("Material recovery rate")}</th>
          </tr></thead>
          <tbody>
            {comparisons.map(route => <tr key={route.code}>
              <th scope="row">{t(methodLabels[route.code])}</th>
              <td>{number.format(route.landfillTPerMw)}</td>
              <td>{number.format(route.co2eTPerMw)}</td>
              <td>{(route.recoveryRate * 100).toFixed(1)}%</td>
            </tr>)}
          </tbody>
        </table></div>
      </details>}
      <div className="pvc2-route-actions">
        <a className="pv-text-button" href={capacityHref} onClick={event => {
          if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
          event.preventDefault();
          if (location.hash !== capacityHref) history.pushState(null, "", capacityHref);
          showCapacityEstimate(true);
        }}>{t("Adjust recycling fee in Performance")}</a>
        <Link className="pv-button" href={businessCaseHref}>{t("Run your business case")} <Arrow /></Link>
        <a className="pv-text-button" href={`?market=${market}${volumeQuery}&inquiry=1#specification`}>{t("Request equipment information")}</a>
      </div>
    </div>
    {reference && money && active && active.fee !== null && active.profit !== null && <div className="pvc2-profit-breakdown" id="pvc2-profit-breakdown">
      <div className="pvc2-profit-breakdown-content" aria-live="polite">
        <h3>{t(methodLabels[active.code])}</h3>
        <div className="pv-form">
          <label>{t("Reporting period")} · {reference.currency}
            <select value={period} onChange={event => setPeriod(event.currentTarget.value as ReportingPeriod)}>
              {reportingPeriods.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
            </select>
          </label>
        </div>
        <dl className="pvc2-profit-totals">
          <div><dt>{t("Recycling fee revenue")}</dt><dd>{periodMoney(active.fee)}</dd></div>
          <div><dt>{t("Material sales revenue")}</dt><dd>{periodMoney(active.materialRevenuePerMw)}</dd></div>
          <div><dt>{t("Total operating costs (OPEX)")}</dt><dd>− {periodMoney(active.opex)}</dd></div>
        </dl>
        <details className="pv-details pvc2-profit-cost-detail" open>
          <summary>{t("Operating cost breakdown")}</summary>
          <dl className="pvc2-profit-costs">
            {active.operatingCostsPerMw.map(({ key, amount }) => <div key={key}><dt>{t(costLabels[key] ?? key)}</dt><dd>{periodMoney(amount)}</dd></div>)}
          </dl>
        </details>
        <dl className="pvc2-profit-totals pvc2-profit-net"><div><dt>{t("Recycling EBITDA")}</dt><dd>{periodMoney(active.profit)}</dd></div></dl>
        <p className="pv-note">{t("Operating costs use the selected market’s Our Solution reference volume. EBITDA excludes depreciation, financing and taxes.")}{" "}
          <Link href={solutionHref(locale, market) + volumeQuery + "#economic"}>{t("View the market assumptions in Our Solution")}</Link>
        </p>
      </div>
    </div>}
  </section>;
}
