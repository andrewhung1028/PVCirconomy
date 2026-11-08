'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { US_STATES } from '@/lib/journey/intake';
import { hypotheticalLabor, type EquipmentDraft, type EquipmentProduct } from '@/lib/commerce/model';
import { useReview } from './review-provider';

const STEPS = ['Product', 'Requirements', 'Site and timing'] as const;

export function EquipmentFlow({ product }: { product: EquipmentProduct }) {
  const router = useRouter();
  const { session, patchEquipment, markEquipmentConfigured } = useReview();
  const draft = session.equipment.product === product ? session.equipment : { ...session.equipment, product };
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const labor = product === 'jb-tool' ? hypotheticalLabor(draft, 'USD') : null;
  useEffect(() => { if (session.equipment.product !== product) patchEquipment({ product }); }, [product, patchEquipment, session.equipment.product]);

  function update<K extends keyof EquipmentDraft>(key: K, value: EquipmentDraft[K]) {
    patchEquipment({ product, [key]: value });
  }
  function next() {
    const problems: string[] = [];
    if (step === 1 && draft.requirements.trim().length < 3) problems.push('Describe the processing requirements you want reviewed.');
    if (step === 2) {
      if (!draft.state) problems.push('Choose a state.');
      if (!/^\d{5}(?:-\d{4})?$/.test(draft.zip.trim())) problems.push('Enter a ZIP code.');
      if (!draft.siteType) problems.push('Choose a site type.');
      if (draft.timing !== 'one-off' && draft.timing !== 'recurring') problems.push('Choose one-off or recurring timing.');
    }
    if (problems.length) { setErrors(problems); return; }
    setErrors([]);
    if (step < 2) setStep(value => value + 1);
  }

  return <div className="pc-wizard">
    <div className="pc-steps" aria-label="Equipment request progress">{STEPS.map((label, index) => <button key={label} type="button" aria-current={index === step ? 'step' : undefined} onClick={() => setStep(index)}>{index + 1}. {label}</button>)}</div>
    {errors.length > 0 && <div className="pc-error-summary" role="alert"><h2>Check this step</h2><ul>{errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
    {step === 0 && <div className="pc-prose">
      {product === 'pv-circulator' ? <>
        <h2>PV Circulator</h2>
        <p>TSGC develops PV Circulator for automated physical dismantling and material separation. Choose a published configuration name if you want it discussed. The name is not a measured capability and not a price.</p>
        <div className="pc-choice-grid">{(['economic', 'basic', 'premium', 'unspecified'] as const).map(name => <button key={name} type="button" className="pc-choice-card" aria-pressed={draft.configuration === name} onClick={() => update('configuration', name)}><strong>{name === 'unspecified' ? 'Decide later' : name[0].toUpperCase() + name.slice(1)}</strong><span>{name === 'unspecified' ? 'Collect requirements first.' : 'Request this published configuration name.'}</span></button>)}</div>
      </> : <>
        <h2>JB Tool</h2>
        <p>JB Tool is a separate equipment request. Published functions, accessories, and specifications are not stated here. Tell us what you need the request to cover.</p>
      </>}
    </div>}
    {step === 1 && <div className="pc-journey-form">
      <label><span className="pc-field-label">Processing requirements</span><textarea value={draft.requirements} onChange={event => update('requirements', event.target.value)} /></label>
      <p className="pc-hint">The next three answers are your operating needs. They are not PV Circulator or JB Tool specifications.</p>
      <div className="pc-pair"><label><span className="pc-field-label">Desired panels per day</span><input value={draft.desiredPanelsPerDay} onChange={event => update('desiredPanelsPerDay', event.target.value)} /></label><label><span className="pc-field-label">Desired electricity</span><input value={draft.desiredElectricity} onChange={event => update('desiredElectricity', event.target.value)} /></label></div>
      <label><span className="pc-field-label">Desired air supply</span><input value={draft.desiredAir} onChange={event => update('desiredAir', event.target.value)} /></label>
      {product === 'jb-tool' && <fieldset><legend>Hypothetical labor illustration</legend><p className="pc-hint">Optional. Daily panels × assumed minutes saved ÷ 60 × hourly wage. This is not a claim about the tool.</p>
        <div className="pc-pair"><label><span className="pc-field-label">Daily panels</span><input inputMode="decimal" value={draft.jbDailyPanels} onChange={event => update('jbDailyPanels', event.target.value)} /></label><label><span className="pc-field-label">Assumed minutes saved</span><input inputMode="decimal" value={draft.jbMinutesSaved} onChange={event => update('jbMinutesSaved', event.target.value)} /></label><label><span className="pc-field-label">Hourly wage, USD</span><input inputMode="decimal" value={draft.jbHourlyWage} onChange={event => update('jbHourlyWage', event.target.value)} /></label></div>
        {labor && <p><strong>Hypothetical illustration: {labor.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} per day.</strong> Not a product specification.</p>}
      </fieldset>}
    </div>}
    {step === 2 && <div className="pc-journey-form">
      <div className="pc-pair"><label><span className="pc-field-label">State</span><select value={draft.state} onChange={event => update('state', event.target.value)}><option value="">Select</option>{US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label><label><span className="pc-field-label">ZIP code</span><input value={draft.zip} onChange={event => update('zip', event.target.value)} /></label></div>
      <label><span className="pc-field-label">Site type</span><select value={draft.siteType} onChange={event => update('siteType', event.target.value as EquipmentDraft['siteType'])}><option value="">Select</option><option value="ground">Ground</option><option value="roof">Roof</option><option value="warehouse">Warehouse</option><option value="other">Other</option></select></label>
      <fieldset><legend>Timing</legend><label className="pc-check"><input type="radio" name="when" checked={draft.timing === 'one-off'} onChange={() => update('timing', 'one-off')} /><span>One-off project</span></label><label className="pc-check"><input type="radio" name="when" checked={draft.timing === 'recurring'} onChange={() => update('timing', 'recurring')} /><span>Recurring operation</span></label></fieldset>
      <label><span className="pc-field-label">Target date</span><span className="pc-hint">Optional. Not a delivery promise.</span><input type="date" value={draft.targetDate} onChange={event => update('targetDate', event.target.value)} /></label>
      <p className="pc-hint">Equipment, installation, freight, trade terms, training, warranty, and taxes are quoted after review. A scenario capex is your planning assumption, not a TSGC price.</p>
    </div>}
    <div className="pc-inline-links">
      {step > 0 && <button className="pc-quiet-button" type="button" onClick={() => setStep(value => value - 1)}>Back</button>}
      {step < 2 && <button className="pc-button" type="button" onClick={next}>Continue</button>}
      {step === 2 && <button className="pc-button" type="button" onClick={() => { next(); if (draft.requirements.trim().length >= 3 && draft.state && /^\d{5}/.test(draft.zip) && draft.siteType && draft.timing) { markEquipmentConfigured(); router.push('/order'); } }}>Review test equipment order</button>}
      <Link className="pc-quiet-button" href={product === 'jb-tool' ? '/business-case?product=jb-tool' : '/business-case?product=pv-circulator'}>Model my business case</Link>
    </div>
  </div>;
}
