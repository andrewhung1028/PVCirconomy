'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { applyRatio, calculateScenario, demoScenario, type MaterialInput, type ScenarioInput } from '@/lib/commerce/model';
import { useReview } from './review-provider';

function numeric(value: string): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function ScenarioModel() {
  const router = useRouter();
  const params = useSearchParams();
  const { session, setScenario, patchEquipment, attachScenario } = useReview();
  const input = session.scenario;
  const calculated = calculateScenario(input);
  const product = params.get('product') === 'jb-tool' ? 'jb-tool' : 'pv-circulator';

  function update(patch: Partial<ScenarioInput>) {
    setScenario({ ...input, ...patch });
  }
  function updateMaterial(code: string, patch: Partial<MaterialInput>) {
    setScenario({ ...input, materials: input.materials.map(material => material.code === code ? { ...material, ...patch } : material) });
  }

  return <div className="pc-wizard">
    <div className="pc-inline-links"><button className="pc-button" type="button" onClick={() => setScenario(demoScenario())}>Fill demo scenario</button></div>
    <p className="pc-hint">All money is entered in the selected currency per tonne or per panel. This model does not convert currencies. The intake fee is the operator’s own customer fee. It is not a PV Circonomy service charge. Scenario capex is your assumption, not a TSGC offered price.</p>
    {!calculated.ok && <div className="pc-error-summary" role="alert"><h2>Check the assumptions</h2><ul>{calculated.errors.map(error => <li key={error.field}>{error.message}</li>)}</ul></div>}
    <div className="pc-journey-form">
      <div className="pc-pair">
        <label><span className="pc-field-label">Currency</span><select value={input.currency} onChange={event => update({ currency: event.target.value })}><option>USD</option><option>EUR</option><option>TWD</option><option>GBP</option></select></label>
        <label><span className="pc-field-label">Kilograms per panel</span><input inputMode="decimal" value={input.kgPerPanel ?? ''} onChange={event => update({ kgPerPanel: numeric(event.target.value) })} /></label>
      </div>
      <fieldset><legend>Throughput</legend>
        <label className="pc-check"><input type="radio" name="mode" checked={input.throughputMode === 'rate'} onChange={() => update({ throughputMode: 'rate' })} /><span>Panels per hour × hours × days × utilization</span></label>
        <label className="pc-check"><input type="radio" name="mode" checked={input.throughputMode === 'monthly'} onChange={() => update({ throughputMode: 'monthly' })} /><span>Panels per month</span></label>
        {input.throughputMode === 'rate' ? <div className="pc-pair">
          <label><span className="pc-field-label">Panels per hour</span><input inputMode="decimal" value={input.panelsPerHour ?? ''} onChange={event => update({ panelsPerHour: numeric(event.target.value) })} /></label>
          <label><span className="pc-field-label">Hours per day</span><input inputMode="decimal" value={input.hoursPerDay ?? ''} onChange={event => update({ hoursPerDay: numeric(event.target.value) })} /></label>
          <label><span className="pc-field-label">Days per month</span><input inputMode="decimal" value={input.daysPerMonth ?? ''} onChange={event => update({ daysPerMonth: numeric(event.target.value) })} /></label>
          <label><span className="pc-field-label">Utilization %</span><input inputMode="decimal" value={input.utilizationPct ?? ''} onChange={event => update({ utilizationPct: numeric(event.target.value) })} /></label>
        </div> : <label><span className="pc-field-label">Panels per month</span><input inputMode="decimal" value={input.panelsPerMonth ?? ''} onChange={event => update({ panelsPerMonth: numeric(event.target.value) })} /></label>}
      </fieldset>
      <fieldset><legend>Recovered-material selling price as % of reference benchmark</legend>
        <div className="pc-inline-links">{([30, 50, 70, 100] as const).map(ratio => <button key={ratio} className="pc-quiet-button" type="button" aria-pressed={input.virginRatioPct === ratio} onClick={() => setScenario(applyRatio(input, ratio))}>{ratio}%</button>)}</div>
        <label><span className="pc-field-label">Custom ratio, 30–100</span><input inputMode="decimal" value={input.virginRatioPct} onChange={event => update({ virginRatioPct: numeric(event.target.value) ?? input.virginRatioPct })} /></label>
        <p className="pc-hint">This changes benchmark-based prices only. A direct selling price stays fixed. It is not a recovery rate, a purity result, or a return.</p>
      </fieldset>
    </div>
    <div className="pc-table-wrap"><table className="pc-model-table"><caption>Materials. Mass share, yield, and saleable fraction are example assumptions.</caption><thead><tr><th>Material</th><th>Mass share %</th><th>Yield %</th><th>Saleable %</th><th>Price basis</th><th>Benchmark / tonne</th><th>Direct price / tonne</th></tr></thead><tbody>
      {input.materials.map(material => <tr key={material.code}><th scope="row">{material.name}</th>
        <td><input aria-label={`${material.name} mass share`} inputMode="decimal" value={material.massSharePct} onChange={event => updateMaterial(material.code, { massSharePct: numeric(event.target.value) ?? 0 })} /></td>
        <td><input aria-label={`${material.name} yield`} inputMode="decimal" value={material.yieldPct} onChange={event => updateMaterial(material.code, { yieldPct: numeric(event.target.value) ?? 0 })} /></td>
        <td><input aria-label={`${material.name} saleable fraction`} inputMode="decimal" value={material.saleablePct} onChange={event => updateMaterial(material.code, { saleablePct: numeric(event.target.value) ?? 0 })} /></td>
        <td><select aria-label={`${material.name} price basis`} value={material.priceMode} onChange={event => updateMaterial(material.code, { priceMode: event.target.value as MaterialInput['priceMode'] })}><option value="benchmark">Benchmark ratio</option><option value="direct">Direct price</option></select></td>
        <td><input aria-label={`${material.name} benchmark`} inputMode="decimal" value={material.benchmarkPrice ?? ''} onChange={event => updateMaterial(material.code, { benchmarkPrice: numeric(event.target.value) })} /></td>
        <td><input aria-label={`${material.name} direct price`} inputMode="decimal" value={material.directPrice ?? ''} onChange={event => updateMaterial(material.code, { directPrice: numeric(event.target.value) })} /></td>
      </tr>)}
    </tbody></table></div>
    {calculated.ok && <p className="pc-hint">Unassigned mass share: {calculated.result.unassignedMassSharePct.toFixed(2)}%. Junction boxes are not listed separately, so copper and polymers are not counted twice.</p>}
    <div className="pc-journey-form pc-pair">
      <label><span className="pc-field-label">Operator intake fee per panel</span><span className="pc-hint">Your customer’s fee. Not a PV Circonomy service charge.</span><input inputMode="decimal" value={input.intakeFeePerPanel ?? ''} onChange={event => update({ intakeFeePerPanel: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">People on payroll</span><input inputMode="decimal" value={input.headcount ?? ''} onChange={event => update({ headcount: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">Paid hours per person per day</span><span className="pc-hint">Not reduced when utilization changes.</span><input inputMode="decimal" value={input.paidHoursPerPersonPerDay ?? ''} onChange={event => update({ paidHoursPerPersonPerDay: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">Wage per hour</span><input inputMode="decimal" value={input.laborWagePerHour ?? ''} onChange={event => update({ laborWagePerHour: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">Labor burden %</span><input inputMode="decimal" value={input.laborBurdenPct ?? ''} onChange={event => update({ laborBurdenPct: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">kWh per panel</span><input inputMode="decimal" value={input.kwhPerPanel ?? ''} onChange={event => update({ kwhPerPanel: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">Electricity price per kWh</span><input inputMode="decimal" value={input.electricityPricePerKwh ?? ''} onChange={event => update({ electricityPricePerKwh: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">Consumables per panel</span><input inputMode="decimal" value={input.consumablesPerPanel ?? ''} onChange={event => update({ consumablesPerPanel: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">Maintenance per month</span><input inputMode="decimal" value={input.maintenancePerMonth ?? ''} onChange={event => update({ maintenancePerMonth: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">Rent per month</span><input inputMode="decimal" value={input.rentPerMonth ?? ''} onChange={event => update({ rentPerMonth: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">Inbound freight per input tonne</span><input inputMode="decimal" value={input.inboundFreightPerTonne ?? ''} onChange={event => update({ inboundFreightPerTonne: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">Outbound freight per sold tonne</span><input inputMode="decimal" value={input.outboundFreightPerTonne ?? ''} onChange={event => update({ outboundFreightPerTonne: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">Residue disposal per tonne</span><input inputMode="decimal" value={input.residueDisposalPerTonne ?? ''} onChange={event => update({ residueDisposalPerTonne: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">Residue tonnes override</span><span className="pc-hint">Blank uses input tonnes minus sold tonnes.</span><input inputMode="decimal" value={input.residueOverrideTonnes ?? ''} onChange={event => update({ residueOverrideTonnes: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">Scenario equipment capex</span><span className="pc-hint">Your assumption. Not a TSGC offered price.</span><input inputMode="decimal" value={input.capex ?? ''} onChange={event => update({ capex: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">Installation</span><input inputMode="decimal" value={input.installation ?? ''} onChange={event => update({ installation: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">Initial freight</span><span className="pc-hint">Counted in investment only, not in monthly freight.</span><input inputMode="decimal" value={input.initialFreight ?? ''} onChange={event => update({ initialFreight: numeric(event.target.value) })} /></label>
      <label><span className="pc-field-label">Other startup</span><input inputMode="decimal" value={input.otherStartup ?? ''} onChange={event => update({ otherStartup: numeric(event.target.value) })} /></label>
    </div>
    {calculated.ok && <section className="pc-result-grid" aria-live="polite">
      <article><h2>Monthly operating cash</h2><p className="pc-hint">Before tax, financing, depreciation, and working-capital changes.</p><p>Panels this month: {calculated.result.panelsPerMonth.toLocaleString('en-US')}</p><p>Input tonnes: {calculated.result.inputTonnes.toLocaleString('en-US')}</p><p>Sold tonnes: {calculated.result.soldTonnes.toLocaleString('en-US')}</p><p>Residue tonnes: {calculated.result.residueTonnes.toLocaleString('en-US')}{calculated.result.residueOverridden ? ' (override)' : ''}</p><p>Material sales: {calculated.result.pricedMaterialCount ? calculated.result.materialRevenue.toLocaleString('en-US', { style: 'currency', currency: calculated.result.currency }) : 'No material price entered'}</p><p>Operator intake fees: {calculated.result.intakeFeeRevenue === null ? 'No fee entered' : calculated.result.intakeFeeRevenue.toLocaleString('en-US', { style: 'currency', currency: calculated.result.currency })}</p><p>Entered costs: {calculated.result.costsKnown.toLocaleString('en-US', { style: 'currency', currency: calculated.result.currency })}</p>{calculated.result.missing.length > 0 && <p className="pc-hint">No assumption entered for: {calculated.result.missing.join(', ')}. Those items are left out, not treated as zero.</p>}<p><strong>{calculated.result.monthlySurplus === null ? 'Surplus needs at least one revenue or cost assumption.' : `Monthly surplus ${calculated.result.monthlySurplus.toLocaleString('en-US', { style: 'currency', currency: calculated.result.currency })}`}</strong></p></article>
      <article><h2>Simple payback</h2>{calculated.result.paybackMonths !== null ? <p><strong>{calculated.result.paybackMonths.toFixed(1)} months</strong> on the investment amounts you entered. This is not a financed return, a quote, or a guaranteed result.</p> : <p><strong>{calculated.result.paybackMessage}</strong></p>}{calculated.result.investmentMissing.length > 0 && <p className="pc-hint">Not included in the investment: {calculated.result.investmentMissing.join(', ')}.</p>}</article>
    </section>}
    <button className="pc-button" type="button" onClick={() => { patchEquipment({ product }); attachScenario(); router.push(product === 'jb-tool' ? '/equipment/jbtool' : '/equipment/pv-circulator'); }}>Use this scenario in my equipment request</button>
  </div>;
}
