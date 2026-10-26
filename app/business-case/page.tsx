'use client';
import { fallback } from '../../lib/fallback';
import { calculateBusinessCase } from '../../lib/calculator/engine';

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

/* =========================================================
   FORMATTERS
========================================================= */

const money = (n: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const money2 = (n: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n || 0));

const number = (n: number, digits = 0) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(n || 0));

/* =========================================================
   HELPERS
========================================================= */

function normalizeRate(value: any) {
  const n = Number(value || 0);
  return n > 1 ? n / 100 : n;
}

function toArray(value: any): any[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).map(
      ([key, item]: [string, any]) => {
        if (item && typeof item === 'object') {
          return {
            code:
              item.code ||
              item.materialCode ||
              item.parameterCode ||
              key,
            ...item,
          };
        }

        return {
          code: key,
          name: key,
          value: Number(item || 0),
        };
      }
    );
  }

  return [];
}

function materialKey(x: any) {
  return (
    x?.code ||
    x?.materialCode ||
    x?.material_code ||
    x?.name ||
    x?.material ||
    ''
  );
}

function materialName(x: any, fallback: string) {
  return (
    x?.name ||
    x?.material ||
    x?.materialName ||
    x?.material_name ||
    fallback
  );
}

function materialRevenueValue(x: any) {
  return Number(
    x?.revenue ??
      x?.materialRevenue ??
      x?.saleableRevenue ??
      x?.annualRevenue ??
      x?.annualMaterialRevenue ??
      x?.recoveredMaterialRevenue ??
      x?.value ??
      0
  );
}

function opexKey(x: any) {
  return (
    x?.code ||
    x?.parameterCode ||
    x?.parameter ||
    x?.name ||
    ''
  );
}

function opexName(x: any, fallback: string) {
  return (
    x?.label ||
    x?.name ||
    x?.parameter ||
    x?.opexParameter ||
    fallback
  );
}

function opexValue(x: any) {
  return Math.abs(
    Number(
      x?.value ??
        x?.annualCost ??
        x?.annual_cost ??
        x?.cost ??
        0
    )
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function Page() {
  const [data, setData] = useState<any>(null);

  const [region, setRegion] = useState('US-CA');
  const [country, setCountry] = useState('');
  const [panels, setPanels] = useState(5000);
  const [fee, setFee] = useState(0.2);

  const primary = 'PVCIRCULATOR';

  const [compare, setCompare] =
    useState('CONVENTIONAL');

  const [result, setResult] =
    useState<any>(null);

  const [busy, setBusy] =
    useState(false);

  const [msg, setMsg] =
    useState('');

  const [materialOpen, setMaterialOpen] =
    useState(false);

  const [opexOpen, setOpexOpen] =
    useState(false);

  /* =======================================================
     LOAD MASTER DATA
  ======================================================= */

  useEffect(() => {
    Promise.resolve(fallback)
      .then((d) => {
        setData(d);

        if (
          d.regions?.[0] &&
          !d.regions.some(
            (x: any) => x.code === 'US-CA'
          )
        ) {
          setRegion(d.regions[0].code);
        }

        const compareSolutions =
          d.solutions?.filter(
            (x: any) =>
              x.code !== 'PVCIRCULATOR' &&
              x.active !== false
          ) || [];

        if (
          compareSolutions.length &&
          !compareSolutions.some(
            (x: any) =>
              x.code === 'CONVENTIONAL'
          )
        ) {
          setCompare(
            compareSolutions[0].code
          );
        }
      })
      .catch(() => {
        setMsg(
          'Unable to load calculator data.'
        );
      });
  }, []);

  /* =======================================================
     MASTER DATA LOOKUPS
  ======================================================= */

  const reg = useMemo(
    () =>
      data?.regions?.find(
        (x: any) =>
          x.code === region
      ),
    [data, region]
  );

  const countries = useMemo<string[]>(() => {
    const regions = (data?.regions || []).filter(
      (x: any) => x.active !== false
    );
    const countryNames: string[] = regions
      .map((x: any) => String(x.country || "").trim())
      .filter((name: string) => name.length > 0);
    return [...new Set<string>(countryNames)].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const countryRegions = useMemo(() =>
    (data?.regions || []).filter((x: any) =>
      x.active !== false && x.country === country
    ).sort((a: any, b: any) => String(a.region).localeCompare(String(b.region))),
    [data, country]
  );

  useEffect(() => {
    if (!data?.regions?.length) return;
    const selected = data.regions.find((x: any) => x.code === region);
    if (selected && !country) setCountry(selected.country);
  }, [data, region, country]);

  function changeCountry(nextCountry: string) {
    setCountry(nextCountry);
    const nextRegion = (data?.regions || []).find((x: any) =>
      x.country === nextCountry && x.active !== false
    );
    setRegion(nextRegion?.code || '');
    setResult(null);
  }

  const pvSolution = useMemo(
    () =>
      data?.solutions?.find(
        (x: any) =>
          x.code === primary
      ),
    [data]
  );

  useEffect(() => {
    if (reg?.defaultFee != null) {
      setFee(
        Number(reg.defaultFee)
      );
    }
  }, [region, reg?.defaultFee]);

  /* =======================================================
     PROCESSING SCHEDULE
  ======================================================= */

  // Use the selected country's SharePoint OPEX assumptions.
  // Support both the raw SharePoint field names and normalized API rows.
  const scheduleParameters = useMemo(() => {
    const countryCode = String(reg?.countryCode || '').trim().toUpperCase();
    const rows = (data?.opex || []).filter((row: any) =>
      String(row.countryCode ?? row['Country Code'] ?? '').trim().toUpperCase() === countryCode &&
      row.active !== false && row.Active !== false &&
      String(row.active ?? row.Active ?? 'true').toLowerCase() !== 'false'
    );

    function readParameter(suffix: string, description: string): number | null {
      const row = rows.find((item: any) => {
        const code = String(
          item.parameterCode ?? item['OPEX Parameter Code'] ?? item.Title ?? item.code ?? item.parameter ?? ''
        ).trim().toUpperCase();
        const label = String(item.parameter ?? item['OPEX Parameter'] ?? '').trim().toLowerCase();
        return code === suffix || code === `${countryCode}-${suffix}` || label === description;
      });
      if (!row) return null;
      const raw = row.value ?? row.Value;
      if (raw === null || raw === undefined || raw === '') return null;
      const value = Number(String(raw).replace(/,/g, ''));
      return Number.isFinite(value) && value > 0 ? value : null;
    }

    return {
      days: readParameter('OPERATING_DAYS_MONTH', 'operating days'),
      hours: readParameter('OPERATING_HOURS_DAY', 'operating hours'),
    };
  }, [data?.opex, reg?.countryCode]);

  const operatingDays = scheduleParameters.days;
  const standardHours = scheduleParameters.hours;
  const pvCapacity = Number(pvSolution?.capacity || 0);
  const scheduleReady = operatingDays !== null && standardHours !== null && pvCapacity > 0;

  const requiredHoursPerDay =
    scheduleReady && panels > 0
      ? panels / operatingDays! / pvCapacity
      : 0;

  const nominalMonthlyCapacity = scheduleReady
    ? pvCapacity * operatingDays! * standardHours!
    : 0;

  const capacityUtilization = nominalMonthlyCapacity > 0
    ? panels / nominalMonthlyCapacity
    : 0;

  const scheduleExceeded = scheduleReady && requiredHoursPerDay > standardHours!;
  const equipmentCapacityExceeded = scheduleReady && requiredHoursPerDay > 24;
  const progressWidth = Math.min(Math.max(capacityUtilization * 100, 0), 100);

  /* =======================================================
     CALCULATE
  ======================================================= */

  async function calc() {
    setBusy(true);
    setResult(null);
    setMsg('');
    setMaterialOpen(false);
    setOpexOpen(false);

    try {
      setResult(calculateBusinessCase(fallback, { regionCode: region, panelsPerMonth: panels, processingFee: fee, solutionCodes: [primary, compare] }));

      setTimeout(() => {
        document
          .getElementById(
            'business-case'
          )
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
      }, 150);
    } catch {
      setMsg(
        'Calculation failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  /* =======================================================
     FOLLOW UP
  ======================================================= */

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg('Preview only: nothing was sent or saved.');
  }

  /* =======================================================
     RESULT LOOKUPS
  ======================================================= */

  const pvResult =
    result?.solutions?.find(
      (s: any) =>
        s.code ===
        'PVCIRCULATOR'
    ) ||
    result?.solutions?.[0];

  const compareResult =
    result?.solutions?.find(
      (s: any) =>
        s.code === compare
    ) ||
    result?.solutions?.[1];

  const currency =
    result?.region?.currency ||
    reg?.currency ||
    'USD';

  /* =======================================================
     BUSINESS CASE
  ======================================================= */

  const processingAdvantage =
    (pvResult?.processingRevenue || 0) -
    (compareResult?.processingRevenue || 0);

  const materialAdvantage =
    (pvResult?.materialRevenue || 0) -
    (compareResult?.materialRevenue || 0);

  const pvTotalRevenue =
    (pvResult?.processingRevenue || 0) +
    (pvResult?.materialRevenue || 0);

  const compareTotalRevenue =
    (compareResult?.processingRevenue || 0) +
    (compareResult?.materialRevenue || 0);

  const totalRevenueAdvantage =
    pvTotalRevenue -
    compareTotalRevenue;

  const opexAdvantage =
    (compareResult?.annualOpex || 0) -
    (pvResult?.annualOpex || 0);

  const ebitdaAdvantage =
    result?.comparison
      ?.ebitdaAdvantage ??
    (pvResult?.annualEbitda || 0) -
      (compareResult?.annualEbitda || 0);

  const opexReduction =
    result?.comparison
      ?.opexReduction ??
    (compareResult?.annualOpex > 0
      ? (compareResult.annualOpex -
          (pvResult?.annualOpex || 0)) /
        compareResult.annualOpex
      : 0);

  const annualPanels =
    Number(panels || 0) * 12;

  const additionalMaterialValuePerPanel =
    annualPanels > 0
      ? materialAdvantage /
        annualPanels
      : 0;

  const residualReduction =
    compareResult?.residualMetricTons >
    0
      ? (compareResult.residualMetricTons -
          (pvResult?.residualMetricTons ||
            0)) /
        compareResult.residualMetricTons
      : 0;

  const pvOpexPerPanel =
    annualPanels > 0
      ? (pvResult?.annualOpex || 0) /
        annualPanels
      : 0;

  const compareOpexPerPanel =
    annualPanels > 0
      ? (compareResult?.annualOpex ||
          0) /
        annualPanels
      : 0;

  const pvRecovery =
    pvResult?.materialRecoveryRate ??
    pvResult?.recoveryRate ??
    null;

  const compareRecovery =
    compareResult?.materialRecoveryRate ??
    compareResult?.recoveryRate ??
    null;

  /* =======================================================
     MATERIAL DETAILS
  ======================================================= */

  const pvMaterials =
    toArray(
      pvResult?.materials ??
      pvResult?.materialDetail ??
      pvResult?.materialDetails ??
      pvResult?.materialBreakdown
    );

  const compareMaterials =
    toArray(
      compareResult?.materials ??
      compareResult?.materialDetail ??
      compareResult?.materialDetails ??
      compareResult?.materialBreakdown
    );

  const materialCodes =
    Array.from(
      new Set([
        ...pvMaterials.map(
          (x: any) =>
            materialKey(x)
        ),
        ...compareMaterials.map(
          (x: any) =>
            materialKey(x)
        ),
      ])
    ).filter(Boolean);

  /* =======================================================
     OPEX DETAILS
  ======================================================= */

  const pvOpex =
    toArray(
      pvResult?.opexDetail ??
      pvResult?.opexDetails ??
      pvResult?.opexBreakdown ??
      pvResult?.opex
    );

  const compareOpex =
    toArray(
      compareResult?.opexDetail ??
      compareResult?.opexDetails ??
      compareResult?.opexBreakdown ??
      compareResult?.opex
    );

  const opexCodes =
    Array.from(
      new Set([
        ...pvOpex.map(
          (x: any) =>
            opexKey(x)
        ),
        ...compareOpex.map(
          (x: any) =>
            opexKey(x)
        ),
      ])
    ).filter(Boolean);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="site">

      {/* HEADER */}



      {/* HERO */}

      <section className="hero">

        <video
          className="heroVideo"
          autoPlay
          muted
          loop
          playsInline
        >
          <source
            src="/PVCirconomy/videos/pv-circulator-operation.mp4"
            type="video/mp4"
          />
        </video>

        <div className="pageShell heroContent">

          <p className="eyebrow">
            PV CIRCULATOR® / BUSINESS CASE
          </p>

          <h1>
            What if you treat PV
            <br />
            in-house?
          </h1>

          <p className="heroLede">
            Enter your monthly panel volume. In 60 seconds, see your annual EBITDA,
            payback period and the value you’re leaving in conventional recycling.
          </p>

        </div>

      </section>

      {/* YOUR OPERATION */}

      <section className="section operationSection">
        <div className="pageShell">

          <div className="sectionIntro">

            <p className="sectionEyebrow">
              YOUR OPERATION
            </p>

            <h2>
              Start with your operation.
            </h2>

          </div>

          <div className="operationTopRow">
            <label className="field">
              <span className="fieldLabel">Country</span>
              <select value={country} onChange={(e) => changeCountry(e.target.value)}>
                {countries.map((name: string) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="fieldLabel">Operating region</span>
              <select value={region} onChange={(e) => { setRegion(e.target.value); setResult(null); }}>
                {countryRegions.map((x: any) => (
                  <option key={x.code} value={x.code}>{x.region}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="fieldLabel">Panels / month</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={panels}
                aria-label="Panels per month"
                onChange={(e) => {
                  const next = e.target.valueAsNumber;
                  if (Number.isFinite(next)) {
                    setPanels(Math.max(0, next));
                    setResult(null);
                  }
                }}
              />
            </label>
          </div>

          <div className="operationBottomRow">
            <label className="field">
              <span className="fieldLabel">Processing / tipping fee
                {reg?.feeUnit && <small>{reg.feeUnit}</small>}
              </span>
              <input type="number" min="0" step="0.01" value={fee}
                onChange={(e) => { setFee(Number(e.target.value)); setResult(null); }} />
            </label>
            <label className="field">
              <span className="fieldLabel">Compare PV Circulator with</span>
              <select value={compare} onChange={(e) => { setCompare(e.target.value); setResult(null); }}>
                {data?.solutions?.filter((x: any) =>
                  x.code !== 'PVCIRCULATOR' && x.active !== false
                ).map((x: any) => (
                  <option key={x.code} value={x.code}>{x.name}</option>
                ))}
              </select>
            </label>
            <button className="calculateButton" onClick={calc} disabled={busy || !region}>
              <span>{busy ? 'CALCULATING…' : 'CALCULATE BUSINESS CASE'}</span>
              {!busy && <span>→</span>}
            </button>
          </div>

          {/* SCHEDULE */}

          <div className="schedule">
            <p className="scheduleLabel">REQUIRED PROCESSING SCHEDULE</p>

            <div className="scheduleMain">
              <strong>
                {!scheduleReady
                  ? 'Operating schedule unavailable'
                  : equipmentCapacityExceeded
                    ? 'Additional equipment required'
                    : scheduleExceeded
                      ? 'Exceeds standard shift capacity'
                      : 'Within standard shift capacity'}
              </strong>
              {scheduleReady && (
                <span>{number(requiredHoursPerDay, 1)} processing hours/day</span>
              )}
            </div>

            <div className="scheduleTrack" role="progressbar"
              aria-label="Single-shift capacity utilization"
              aria-valuenow={scheduleReady ? Math.round(capacityUtilization * 100) : 0}
              aria-valuemin={0} aria-valuemax={100}>
              <div
                className={`scheduleProgress${equipmentCapacityExceeded ? ' scheduleProgressCritical' : scheduleExceeded ? ' scheduleProgressWarning' : ''}`}
                style={{ width: `${progressWidth}%` }}
              />
            </div>

            <div className="scheduleInsight">
              {scheduleReady ? (
                <p>
                  Based on <strong>{number(operatingDays!, 2)} operating days/month</strong> in the selected country
                  and <strong>{number(pvCapacity)} panels/hour</strong> per line.
                  {' '}A standard shift is {number(standardHours!, 1)} hours/day.
                  {' '}{equipmentCapacityExceeded
                    ? `At ${number(panels)} panels/month, one line would require ${number(requiredHoursPerDay, 1)} hours/day—more than the 24-hour daily limit. Additional equipment is required.`
                    : scheduleExceeded
                      ? `At ${number(panels)} panels/month, ${number(requiredHoursPerDay, 1)} hours/day are required. Extend operating hours or add shifts to meet demand.`
                      : `At ${number(panels)} panels/month, ${number(requiredHoursPerDay, 1)} hours/day are required, within the standard shift.`}
                </p>
              ) : (
                <p>Operating days or hours are missing from the selected country's SharePoint OPEX parameters. Verify OPERATING_DAYS_MONTH and OPERATING_HOURS_DAY.</p>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* RESULTS */}

      {result &&
        pvResult &&
        compareResult && (
          <>

            {/* BUSINESS CASE */}

            <section
              className="section businessSection"
              id="business-case"
            >
              <div className="pageShell">

                <div className="businessIntro">

                  <p className="sectionEyebrow">
                    BUSINESS CASE
                  </p>

                  <h2>
                    See where the economics
                    <br />
                    come from.
                  </h2>

                  <p className="sectionDescription">
                    Annualized results using
                    the same panel volume and
                    processing fee for both
                    approaches.
                  </p>

                  <a
                    className="methodologyLink"
                    href="/PVCirconomy/methodology"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Read the Business Case calculation methodology (opens in a new tab)"
                  >
                    HOW WE CALCULATE THE BUSINESS CASE <span aria-hidden="true">↗</span>
                  </a>

                </div>

                <div className="businessTableWrap">

                  <table className="businessTable">

                    <thead>
                      <tr>

                        <th>
                          Annual Business Case
                        </th>

                        <th>
                          {compareResult.name}
                        </th>

                        <th>
                          PV Circulator
                        </th>

                        <th>
                          PV Advantage
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      <tr>
                        <td>
                          Processing revenue
                        </td>

                        <td>
                          {money(
                            compareResult.processingRevenue,
                            currency
                          )}
                        </td>

                        <td>
                          {money(
                            pvResult.processingRevenue,
                            currency
                          )}
                        </td>

                        <td>
                          {money(
                            processingAdvantage,
                            currency
                          )}
                        </td>
                      </tr>

                      {/* MATERIAL REVENUE */}

                      <tr>
                        <td>
                          <button
                            type="button"
                            className="tableExpandButton"
                            onClick={() =>
                              setMaterialOpen(
                                (v) => !v
                              )
                            }
                          >
                            <span className="tableExpandIcon">
                              {materialOpen
                                ? '−'
                                : '+'}
                            </span>

                            Material revenue
                          </button>
                        </td>

                        <td>
                          {money(
                            compareResult.materialRevenue,
                            currency
                          )}
                        </td>

                        <td>
                          {money(
                            pvResult.materialRevenue,
                            currency
                          )}
                        </td>

                        <td className="positive">
                          {materialAdvantage >
                          0
                            ? '+'
                            : ''}

                          {money(
                            materialAdvantage,
                            currency
                          )}
                        </td>
                      </tr>

                      {materialOpen &&
                        materialCodes.map(
                          (code: any) => {
                            const p =
                              pvMaterials.find(
                                (x: any) =>
                                  materialKey(x) ===
                                  code
                              ) || {};

                            const c =
                              compareMaterials.find(
                                (x: any) =>
                                  materialKey(x) ===
                                  code
                              ) || {};

                            const pvValue =
                              materialRevenueValue(
                                p
                              );

                            const compareValue =
                              materialRevenueValue(
                                c
                              );

                            const advantage =
                              pvValue -
                              compareValue;

                            const label =
                              materialName(
                                p,
                                materialName(
                                  c,
                                  String(code)
                                )
                              );

                            return (
                              <tr
                                className="detailRow"
                                key={String(code)}
                              >
                                <td className="materialDetailName">
                                  {label}
                                </td>

                                <td>
                                  {money(
                                    compareValue,
                                    currency
                                  )}
                                </td>

                                <td>
                                  {money(
                                    pvValue,
                                    currency
                                  )}
                                </td>

                                <td
                                  className={
                                    advantage >= 0
                                      ? 'positive'
                                      : 'negative'
                                  }
                                >
                                  {advantage > 0
                                    ? '+'
                                    : ''}

                                  {money(
                                    advantage,
                                    currency
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )}

                      <tr className="strongRow">
                        <td>
                          Total revenue
                        </td>

                        <td>
                          {money(
                            compareTotalRevenue,
                            currency
                          )}
                        </td>

                        <td>
                          {money(
                            pvTotalRevenue,
                            currency
                          )}
                        </td>

                        <td className="positive">
                          {totalRevenueAdvantage >
                          0
                            ? '+'
                            : ''}

                          {money(
                            totalRevenueAdvantage,
                            currency
                          )}
                        </td>
                      </tr>

                      {/* OPEX */}

                      <tr>
                        <td>
                          <button
                            type="button"
                            className="tableExpandButton"
                            onClick={() =>
                              setOpexOpen(
                                (v) => !v
                              )
                            }
                          >
                            <span className="tableExpandIcon">
                              {opexOpen
                                ? '−'
                                : '+'}
                            </span>

                            OPEX
                          </button>
                        </td>

                        <td className="negative">
                          -
                          {money(
                            Math.abs(
                              compareResult.annualOpex
                            ),
                            currency
                          )}
                        </td>

                        <td className="negative">
                          -
                          {money(
                            Math.abs(
                              pvResult.annualOpex
                            ),
                            currency
                          )}
                        </td>

                        <td className="positive">
                          {opexAdvantage >
                          0
                            ? '+'
                            : ''}

                          {money(
                            opexAdvantage,
                            currency
                          )}
                        </td>
                      </tr>

                      {opexOpen &&
                        opexCodes.map(
                          (code: any) => {
                            const p =
                              pvOpex.find(
                                (x: any) =>
                                  opexKey(x) ===
                                  code
                              ) || {};

                            const c =
                              compareOpex.find(
                                (x: any) =>
                                  opexKey(x) ===
                                  code
                              ) || {};

                            const pvValue =
                              opexValue(p);

                            const compareValue =
                              opexValue(c);

                            const saving =
                              compareValue -
                              pvValue;

                            const label =
                              opexName(
                                p,
                                opexName(
                                  c,
                                  String(code)
                                )
                              );

                            return (
                              <tr
                                className="detailRow"
                                key={String(code)}
                              >
                                <td className="opexDetailName">
                                  {label}
                                </td>

                                <td className="negative">
                                  -
                                  {money(
                                    compareValue,
                                    currency
                                  )}
                                </td>

                                <td className="negative">
                                  -
                                  {money(
                                    pvValue,
                                    currency
                                  )}
                                </td>

                                <td
                                  className={
                                    saving >= 0
                                      ? 'positive'
                                      : 'negative'
                                  }
                                >
                                  {saving > 0
                                    ? '+'
                                    : ''}

                                  {money(
                                    saving,
                                    currency
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )}

                      <tr className="ebitdaRow">
                        <td>
                          EBITDA / annual
                          contribution
                        </td>

                        <td>
                          {money(
                            compareResult.annualEbitda,
                            currency
                          )}
                        </td>

                        <td>
                          {money(
                            pvResult.annualEbitda,
                            currency
                          )}
                        </td>

                        <td className="positive">
                          {ebitdaAdvantage >
                          0
                            ? '+'
                            : ''}

                          {money(
                            ebitdaAdvantage,
                            currency
                          )}
                        </td>
                      </tr>

                    </tbody>

                  </table>

                </div>

              </div>
            </section>

            {/* BUSINESS CASE SUMMARY — STANDALONE SECTION */}
            <section className="section businessSummarySection">
              <div className="pageShell">
                <div className="decisionSummary">
                  <p className="sectionEyebrow light">BUSINESS CASE SUMMARY</p>
                  <h2>
                    {money(pvResult.annualEbitda, currency)} in annual EBITDA.
                    <br />
                    See what your recycling operation could achieve.
                  </h2>
                  <p className="summaryLead">
                    At {number(panels)} panels/month, PV Circulator delivers an estimated{' '}
                    <strong>{money(ebitdaAdvantage, currency)} more annual EBITDA</strong>{' '}
                    than {compareResult.name}—turning cleaner recovery into stronger economics.
                  </p>
                  {pvResult.simplePaybackYears > 0 && (
                    <p className="summaryPayback">
                      Estimated standalone simple payback:{' '}
                      <strong>{number(pvResult.simplePaybackYears, 1)} years</strong>.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* COMPARISON */}

            <section className="section comparisonSection">
              <div className="pageShell">

                <div className="comparisonIntro">

                  <p className="sectionEyebrow light">
                    COMPARISON
                  </p>

                  <h2>
                    PV Circulator vs.{' '}{compareResult.name}.
                  </h2>

                  <p className="sectionDescription lightText">
                    Compare annual economics,
                    operating cost and recovered
                    material value on the same
                    processing basis.
                  </p>

                </div>

                <div className="comparisonKpis">

                  <div className="comparisonKpi">
                    <span>
                      Annual EBITDA Advantage
                    </span>

                    <strong>
                      {money(
                        ebitdaAdvantage,
                        currency
                      )}
                    </strong>

                    <small>
                      additional annual EBITDA
                    </small>
                  </div>

                  <div className="comparisonKpi">
                    <span>
                      Operating Cost Reduction
                    </span>

                    <strong>
                      {number(
                        normalizeRate(
                          opexReduction
                        ) * 100
                      )}
                      %
                    </strong>

                    <small>
                      vs. {compareResult.name}
                    </small>
                  </div>

                  <div className="comparisonKpi">
                    <span>
                      Additional Material Value
                    </span>

                    <strong>
                      {money2(
                        additionalMaterialValuePerPanel,
                        currency
                      )}
                    </strong>

                    <small>
                      per processed panel
                    </small>
                  </div>

                  <div className="comparisonKpi">
                    <span>
                      Residual Reduction
                    </span>

                    <strong>
                      {number(
                        normalizeRate(
                          residualReduction
                        ) * 100
                      )}
                      %
                    </strong>

                    <small>
                      requiring secondary treatment
                    </small>
                  </div>

                </div>

                <div className="solutionCompare">

                  {/* PV */}

                  <article className="solutionCard solutionPrimary">

                    <div className="solutionCardTop">

                      <p className="solutionLabel">
                        PV CIRCULATOR®
                      </p>

                      <h3>
                        Layer-by-layer separation.
                        <br />
                        Preserve more value.
                      </h3>

                    </div>

                    <div className="solutionMetrics">

                      <div>
                        <span>
                          Material recovery rate
                        </span>

                        <strong>
                          {pvRecovery != null
                            ? `${number(
                                normalizeRate(
                                  pvRecovery
                                ) * 100,
                                1
                              )}%`
                            : '—'}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Residual / mixed fraction
                        </span>

                        <strong>
                          {number(
                            pvResult.residualMetricTons,
                            1
                          )}{' '}
                          t / yr
                        </strong>
                      </div>

                      <div>
                        <span>
                          OPEX / panel
                        </span>

                        <strong>
                          {money2(
                            pvOpexPerPanel,
                            currency
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Annual EBITDA
                        </span>

                        <strong>
                          {money(
                            pvResult.annualEbitda,
                            currency
                          )}
                        </strong>
                      </div>

                    </div>

                  </article>

                  {/* COMPARE */}

                  <article className="solutionCard solutionCompareCard">

                    <div className="solutionCardTop">

                      <p className="solutionLabel">
                        {compareResult.name}
                      </p>

                      <h3>
                        Compare the same volume.
                        <br />
                        See the economic difference.
                      </h3>

                    </div>

                    <div className="solutionMetrics">

                      <div>
                        <span>
                          Material recovery rate
                        </span>

                        <strong>
                          {compareRecovery != null
                            ? `${number(
                                normalizeRate(
                                  compareRecovery
                                ) * 100,
                                1
                              )}%`
                            : '—'}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Residual / mixed fraction
                        </span>

                        <strong>
                          {number(
                            compareResult.residualMetricTons,
                            1
                          )}{' '}
                          t / yr
                        </strong>
                      </div>

                      <div>
                        <span>
                          OPEX / panel
                        </span>

                        <strong>
                          {money2(
                            compareOpexPerPanel,
                            currency
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Annual EBITDA
                        </span>

                        <strong>
                          {money(
                            compareResult.annualEbitda,
                            currency
                          )}
                        </strong>
                      </div>

                    </div>

                  </article>

                </div>


              </div>
            </section>

            {/* BEYOND PROCESSING */}

            <section className="section beyondSection">
              <div className="pageShell">

                <div className="sectionIntro">
                  <p className="sectionEyebrow">BEYOND PROCESSING</p>
                  <h2>More than recycling equipment.<br />Build a business that works.</h2>
                  <p className="sectionDescription">
                    From feedstock development and flexible deployment to material offtake,
                    upcycling and traceability, PV Circonomy helps recyclers build
                    an economically viable PV recycling business.
                  </p>
                </div>

                <div className="beyondGrid">
                  <article>
                    <span>FEEDSTOCK</span>
                    <h3>Secure your feedstock.</h3>
                    <p>
                      Access PV recycling opportunities through PV Circonomy&apos;s industry
                      network and strategic partnerships to support a reliable
                      processing pipeline.
                    </p>
                  </article>

                  <article>
                    <span>DEPLOYABILITY</span>
                    <h3>Deploy where it matters.</h3>
                    <p>
                      Modular systems support on-site and near-site recycling,
                      reducing transport costs.
                    </p>
                  </article>

                  <article>
                    <span>MATERIAL VALUE</span>
                    <h3>Recover more. Earn more.</h3>
                    <p>
                      Preserve material quality through layer-by-layer separation,
                      enabling higher recovery rates and greater revenue potential
                      from recovered materials.
                    </p>
                  </article>

                  <article>
                    <span>OFFTAKE</span>
                    <h3>Move recovered materials.</h3>
                    <p>
                      Downstream support helps create practical outlets for
                      recovered material streams.
                    </p>
                  </article>

                  <article>
                    <span>MATERIAL UPCYCLING</span>
                    <h3>From materials to products.</h3>
                    <p>
                      Unlock new revenue opportunities with PV Circonomy&apos;s material
                      upcycling solutions—transforming recovered resources
                      into marketable, value-added products.
                    </p>
                  </article>

                  <article>
                    <span>TRACEABILITY</span>
                    <h3>Make your value measurable.</h3>
                    <p>
                      Digital traceability documents material recovery,
                      supports lifecycle reporting, and helps demonstrate
                      the environmental value of your recycling operation.
                    </p>
                  </article>
                </div>

                <div className="operationSupport">
                  <div>
                    <span>FROM EQUIPMENT TO BUSINESS</span>
                    <h3>Your recycling business.<br />Our expertise behind it.</h3>
                  </div>
                  <p>
                    From equipment deployment and operator training to feedstock
                    development, material offtake, upcycling, and traceability,
                    PV Circonomy helps you build an economically viable PV recycling operation.
                  </p>
                </div>
              </div>
            </section>

            {/* SOLUTION */}

            <section className="section solutionSection">
              <div className="pageShell">

                <div className="sectionIntro">

                  <p className="sectionEyebrow">
                    SOLUTION
                  </p>

                  <h2>
                    Explore the PV Circulator®
                    solution.
                  </h2>

                  <p className="sectionDescription">
                    Review the full PV Circulator
                    solution, system configuration
                    and lifecycle support.
                  </p>

                </div>

                <div className="brochureActions">

                  <a
                    className="buttonDark"
                    href="/PVCirconomy/2026_PV_Circulator_Solution_Brochure.pdf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    OPEN FULL-SCREEN BROCHURE
                    <span>→</span>
                  </a>

                  <a
                    className="buttonText"
                    href="/PVCirconomy/2026_PV_Circulator_Solution_Brochure.pdf"
                    download
                  >
                    SAVE PDF
                  </a>

                </div>

                <div className="brochureFrame">
                  <iframe
                    src="/PVCirconomy/2026_PV_Circulator_Solution_Brochure.pdf"
                    title="2026 PV Circulator Solution Brochure"
                  />
                </div>

              </div>
            </section>

          </>
        )}

            {/* FOLLOW UP */}

            <section id="follow-up" className="followSection">
              <div className="pageShell">

                <div className="followIntro">

                  <p className="sectionEyebrow light">
                    FOLLOW UP
                  </p>

                  <h2>
                    Take the next step.
                  </h2>

                  <p>
                    Receive your business case
                    and brochure, or connect with
                    our team to discuss equipment,
                    recycling services or your
                    project.
                  </p>

                </div>

                <form
                  className="followForm"
                  onSubmit={save}
                >

                  <div className="followGrid">

                    <label>
                      <span>Name</span>
                      <input
                        name="name"
                        placeholder="Your name"
                        required
                      />
                    </label>

                    <label>
                      <span>
                        Business email
                      </span>
                      <input
                        name="email"
                        type="email"
                        placeholder="name@company.com"
                        required
                      />
                    </label>

                    <label>
                      <span>Company</span>
                      <input
                        name="company"
                        placeholder="Company"
                      />
                    </label>

                    <label>
                      <span>
                        Country / region
                      </span>
                      <input
                        name="country"
                        placeholder="Country / region"
                      />
                    </label>

                  </div>

                  <label className="followFull">

                    <span>
                      What would you like to explore?
                    </span>

                    <select
                      name="intent"
                      defaultValue="Email Summary"
                    >
                      <option value="Email Summary">
                        Receive My Business Case
                      </option>

                      <option value="Download PDF">
                        Receive Business Case + Brochure
                      </option>

                      <option value="Request Meeting">
                        Schedule a Meeting
                      </option>

                      <option value="Request Quote">
                        Request a Quotation
                      </option>

                      <option value="Purchase Interest">
                        Discuss Purchase
                      </option>
                    </select>

                  </label>

                  <p className="formDisclaimer">
                    By submitting, you agree that
                    PV Circonomy may use the information
                    provided to send this
                    business-case result and follow
                    up regarding PV recycling
                    solutions. Calculations are
                    illustrative and are not a
                    quotation or guarantee.
                  </p>

                  {!result && <p className="formDisclaimer">Calculate your business case above to enable submission.</p>}
                  <button
                    className="followSubmit"
                    type="submit"
                    disabled={!result}
                  >
                    SUBMIT &amp; SEND MY BUSINESS CASE
                    <span>→</span>
                  </button>

                </form>

              </div>
            </section>

      {/* MESSAGE */}

      {msg && (
        <button
          className="toast"
          onClick={() =>
            setMsg('')
          }
        >
          {msg}
        </button>
      )}



    </div>
  );
}
