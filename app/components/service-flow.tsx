'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { US_STATES } from '@/lib/journey/intake';
import { demoService, estimateService, type ServiceDraft } from '@/lib/commerce/model';
import { useReview } from './review-provider';

const STEPS = ['Panels', 'Location', 'Timing and logistics', 'Estimate'] as const;

export function ServiceFlow() {
  const router = useRouter();
  const { session, patchService, markServiceEstimated } = useReview();
  const draft = session.service;
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const estimate = estimateService(draft);

  function update<K extends keyof ServiceDraft>(key: K, value: ServiceDraft[K]) {
    patchService({ [key]: value });
    setErrors(current => current.filter(error => error.field !== key));
  }
  function message(field: string) {
    return errors.find(error => error.field === field)?.message;
  }
  function next() {
    const result = estimateService(draft);
    const fields = step === 0 ? ['panelType', 'condition', 'quantityMode', 'count', 'weight', 'weightUnit', 'estimatedKgPerPanel', 'packaging']
      : step === 1 ? ['state', 'zip', 'siteType']
      : ['timing', 'targetDate', 'logistics', 'handlingRate'];
    const stepErrors = result.ok ? [] : result.errors.filter(error => fields.includes(error.field));
    if (step < 3 && stepErrors.length) {
      setErrors(stepErrors);
      return;
    }
    setErrors([]);
    setStep(value => Math.min(3, value + 1));
  }

  return <div className="pc-wizard">
    <div className="pc-steps" aria-label="Service request progress">{STEPS.map((label, index) => <button key={label} type="button" aria-current={index === step ? 'step' : undefined} onClick={() => setStep(index)}>{index + 1}. {label}</button>)}</div>
    <div className="pc-inline-links"><button className="pc-quiet-button" type="button" onClick={() => { patchService(demoService()); setErrors([]); setStep(3); }}>Fill demo data</button></div>
    {errors.length > 0 && <div className="pc-error-summary" role="alert"><h2>Check this step</h2><ul>{errors.map(error => <li key={error.field}>{error.message}</li>)}</ul></div>}
    {step === 0 && <div className="pc-journey-form">
      <label><span className="pc-field-label">Panel type</span><select aria-invalid={Boolean(message('panelType'))} value={draft.panelType} onChange={event => update('panelType', event.target.value as ServiceDraft['panelType'])}><option value="">Select</option><option value="crystalline-silicon">Crystalline silicon</option><option value="bifacial">Bifacial</option><option value="thin-film">Thin-film</option><option value="mixed">Mixed</option><option value="unknown">Unknown</option></select>{message('panelType') && <span className="pc-field-error">{message('panelType')}</span>}</label>
      <label><span className="pc-field-label">Condition</span><select aria-invalid={Boolean(message('condition'))} value={draft.condition} onChange={event => update('condition', event.target.value as ServiceDraft['condition'])}><option value="">Select</option><option value="intact">Intact</option><option value="damaged">Damaged</option><option value="mixed">Mixed</option><option value="unknown">Unknown</option></select>{message('condition') && <span className="pc-field-error">{message('condition')}</span>}</label>
      <fieldset><legend>Quantity</legend>
        <label className="pc-check"><input type="radio" name="qty" checked={draft.quantityMode === 'count'} onChange={() => update('quantityMode', 'count')} /><span>Panel count</span></label>
        <label className="pc-check"><input type="radio" name="qty" checked={draft.quantityMode === 'weight'} onChange={() => update('quantityMode', 'weight')} /><span>Weight</span></label>
        {message('quantityMode') && <span className="pc-field-error">{message('quantityMode')}</span>}
      </fieldset>
      {draft.quantityMode === 'count' && <div className="pc-pair"><label><span className="pc-field-label">Panel count</span><input inputMode="numeric" aria-invalid={Boolean(message('count'))} value={draft.count} onChange={event => update('count', event.target.value)} />{message('count') && <span className="pc-field-error">{message('count')}</span>}</label><label><span className="pc-field-label">Estimated kg per panel</span><span className="pc-hint">Used only to show an estimated weight. It is not multiplied by a price per tonne.</span><input inputMode="decimal" aria-invalid={Boolean(message('estimatedKgPerPanel'))} value={draft.estimatedKgPerPanel} onChange={event => update('estimatedKgPerPanel', event.target.value)} />{message('estimatedKgPerPanel') && <span className="pc-field-error">{message('estimatedKgPerPanel')}</span>}</label></div>}
      {draft.quantityMode === 'weight' && <div className="pc-pair"><label><span className="pc-field-label">Weight</span><input inputMode="decimal" aria-invalid={Boolean(message('weight'))} value={draft.weight} onChange={event => update('weight', event.target.value)} />{message('weight') && <span className="pc-field-error">{message('weight')}</span>}</label><label><span className="pc-field-label">Unit</span><select aria-invalid={Boolean(message('weightUnit'))} value={draft.weightUnit} onChange={event => update('weightUnit', event.target.value as ServiceDraft['weightUnit'])}><option value="">Select</option><option value="kg">Kilograms</option><option value="tonne">Tonnes</option></select></label></div>}
      <label><span className="pc-field-label">Packaging</span><select aria-invalid={Boolean(message('packaging'))} value={draft.packaging} onChange={event => update('packaging', event.target.value as ServiceDraft['packaging'])}><option value="">Select</option><option value="palletized">Palletized</option><option value="crated">Crated</option><option value="loose">Loose</option><option value="mixed">Mixed</option><option value="unknown">Unknown</option></select>{message('packaging') && <span className="pc-field-error">{message('packaging')}</span>}</label>
    </div>}
    {step === 1 && <div className="pc-journey-form">
      <p className="pc-hint">PV Circonomy describes recycling service in California. A request from another state can be prepared here, and it is not acceptance of that load.</p>
      <div className="pc-pair"><label><span className="pc-field-label">State</span><select aria-invalid={Boolean(message('state'))} value={draft.state} onChange={event => update('state', event.target.value)}><option value="">Select</option>{US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select>{message('state') && <span className="pc-field-error">{message('state')}</span>}</label><label><span className="pc-field-label">ZIP code</span><input inputMode="numeric" aria-invalid={Boolean(message('zip'))} value={draft.zip} onChange={event => update('zip', event.target.value)} />{message('zip') && <span className="pc-field-error">{message('zip')}</span>}</label></div>
      <label><span className="pc-field-label">Site type</span><select aria-invalid={Boolean(message('siteType'))} value={draft.siteType} onChange={event => update('siteType', event.target.value as ServiceDraft['siteType'])}><option value="">Select</option><option value="ground">Ground mount</option><option value="roof">Rooftop</option><option value="warehouse">Warehouse</option><option value="other">Other</option></select>{message('siteType') && <span className="pc-field-error">{message('siteType')}</span>}</label>
    </div>}
    {step === 2 && <div className="pc-journey-form">
      <fieldset><legend>Timing</legend><label className="pc-check"><input type="radio" name="timing" checked={draft.timing === 'one-off'} onChange={() => update('timing', 'one-off')} /><span>One-off</span></label><label className="pc-check"><input type="radio" name="timing" checked={draft.timing === 'recurring'} onChange={() => update('timing', 'recurring')} /><span>Recurring</span></label>{message('timing') && <span className="pc-field-error">{message('timing')}</span>}</fieldset>
      <label><span className="pc-field-label">Target date</span><span className="pc-hint">Optional. A date does not reserve a truck.</span><input type="date" value={draft.targetDate} onChange={event => update('targetDate', event.target.value)} /></label>
      <fieldset><legend>Logistics</legend>
        <label className="pc-check"><input type="radio" name="logistics" checked={draft.logistics === 'pickup-assessment'} onChange={() => update('logistics', 'pickup-assessment')} /><span>Pickup assessment</span></label>
        <label className="pc-check"><input type="radio" name="logistics" checked={draft.logistics === 'own-carrier'} onChange={() => update('logistics', 'own-carrier')} /><span>I will use my own carrier</span></label>
        <label className="pc-check"><input type="radio" name="logistics" checked={draft.logistics === 'delivery-pending'} onChange={() => update('logistics', 'delivery-pending')} /><span>Delivery — destination pending confirmation</span></label>
        {message('logistics') && <span className="pc-field-error">{message('logistics')}</span>}
      </fieldset>
      <div className="pc-pair"><label><span className="pc-field-label">Example handling rate</span><span className="pc-hint">Leave blank if you want handling quoted after review. Do not enter zero.</span><input inputMode="decimal" aria-invalid={Boolean(message('handlingRate'))} value={draft.handlingRate} onChange={event => update('handlingRate', event.target.value)} />{message('handlingRate') && <span className="pc-field-error">{message('handlingRate')}</span>}</label><label><span className="pc-field-label">Rate unit</span><select value={draft.handlingUnit} onChange={event => update('handlingUnit', event.target.value as ServiceDraft['handlingUnit'])}><option value="per-panel">Per panel</option><option value="per-kg">Per kilogram</option><option value="per-tonne">Per tonne</option></select></label></div>
    </div>}
    {step === 3 && <div className="pc-result-grid">
      {estimate.ok ? <>
        <section><h2>Estimated known charges</h2>{estimate.estimate.knownTotal === null ? <p>No handling amount is calculated yet.</p> : <p className="pc-total">{estimate.estimate.knownTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>}{estimate.estimate.known.map(line => <p key={line.label}><strong>{line.label}.</strong> {line.detail}</p>)}{estimate.estimate.estimatedWeightKg !== null && <p className="pc-hint">Estimated weight {estimate.estimate.estimatedWeightKg.toLocaleString('en-US')} kg. This weight is not a price.</p>}</section>
        <section><h2>Additional items require a quote</h2><ul className="pc-note-list">{estimate.estimate.quoted.map(item => <li key={item.label}><strong>{item.label}</strong><span>{item.detail}</span></li>)}</ul><p className="pc-hint">Acceptance is pending review. Thin-film and unknown panels can be submitted and are not treated as accepted.</p></section>
      </> : <div className="pc-error-summary" role="alert"><h2>The estimate needs a correction</h2><ul>{estimate.errors.map(error => <li key={error.field}>{error.message}</li>)}</ul></div>}
    </div>}
    <div className="pc-inline-links">
      {step > 0 && <button className="pc-quiet-button" type="button" onClick={() => setStep(value => value - 1)}>Back</button>}
      {step < 3 && <button className="pc-button" type="button" onClick={next}>Continue</button>}
      {step === 3 && <button className="pc-button" type="button" onClick={() => { const result = estimateService(draft); if (!result.ok) { setErrors(result.errors); setStep(0); return; } markServiceEstimated(); router.push('/order'); }}>Review test service order</button>}
    </div>
  </div>;
}
