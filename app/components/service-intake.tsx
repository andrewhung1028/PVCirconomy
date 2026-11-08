'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { recordPreviewEvent } from '@/lib/journey/events';
import {
  CONDITIONS,
  LOADING_OPTIONS,
  PACKAGING,
  PANEL_TYPES,
  US_STATES,
  WEIGHT_UNITS,
  emptyIntake,
  fictionalPreviewDraft,
  photosRequired,
  validateIntake,
  type IntakeDraft,
  type IntakeInput,
} from '@/lib/journey/intake';
import { FRONTEND_COMMERCIAL_ACTIONS, frontendTransition } from '@/lib/journey/states';

const ACTION_LABELS: Record<(typeof FRONTEND_COMMERCIAL_ACTIONS)[number], string> = {
  approve_quote: 'Approve quote',
  accept_quote: 'Accept quote',
  pay: 'Pay and place order',
  place_order: 'Place order',
  confirm_logistics: 'Confirm logistics',
  issue_documents: 'Issue completion documents',
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <span id={id} className="pc-field-error">{message}</span>;
}

export function ServiceIntake() {
  const params = useSearchParams();
  const [form, setForm] = useState<IntakeInput>(emptyIntake);
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const [draft, setDraft] = useState<IntakeDraft | null>(null);
  const [refusal, setRefusal] = useState('');
  const started = useRef(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [focusToken, setFocusToken] = useState(0);
  const base = `intake-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    if (!focusToken) return;
    summaryRef.current?.focus();
  }, [focusToken, errors, draft]);

  useEffect(() => {
    const demo = params.get('previewDemo');
    if (demo === 'errors') {
      const next: IntakeInput = { ...emptyIntake(), state: 'NY', zip: '90210', workEmail: 'person@gmail.com', transport: 'pickup', panelType: 'unknown', condition: 'damaged' };
      setForm(next);
      const result = validateIntake(next);
      if (!result.ok) setErrors(result.errors);
      setDraft(null);
    }
    if (demo === 'draft') {
      setForm(fictionalPreviewDraft);
      const result = validateIntake(fictionalPreviewDraft);
      if (result.ok) setDraft(result.draft);
    }
  }, [params]);

  function update<K extends keyof IntakeInput>(key: K, value: IntakeInput[K]) {
    setForm(current => ({ ...current, [key]: value }));
    setDraft(null);
    setRefusal('');
  }

  function message(field: string) {
    return errors.find(error => error.field === field)?.message;
  }

  function describedBy(field: string, hintId?: string) {
    const ids = [hintId, message(field) ? `${base}-${field}-error` : ''].filter(Boolean);
    return ids.length ? ids.join(' ') : undefined;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateIntake(form);
    if (!result.ok) {
      setErrors(result.errors);
      setDraft(null);
      setFocusToken(token => token + 1);
      return;
    }
    setErrors([]);
    setDraft(result.draft);
    recordPreviewEvent({ name: 'intake_validated', exceptionCount: result.exceptions.length });
    setFocusToken(token => token + 1);
  }

  const showPhotos = photosRequired(form);
  const showPickup = form.transport === 'pickup';
  const personalEmail = message('workEmail')?.includes('personal mailbox');

  return (
    <form className="pc-journey-form" onSubmit={onSubmit} noValidate onFocus={() => {
      if (started.current) return;
      started.current = true;
      recordPreviewEvent({ name: 'intake_started' });
    }}>
      <div className="pc-draft-result">
        <strong className="pc-not-submitted">Preview — not submitted</strong>
        <p>Typing here does not create a case. Nothing is sent, saved in this browser, or passed to a CRM, email tool, or payment service.</p>
      </div>
      {errors.length > 0 && (
        <div className="pc-error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
          <h2>Check these fields</h2>
          <ul>
            {errors.map(error => <li key={`${error.field}-${error.message}`}><a href={`#${base}-${error.field}`}>{error.message}</a></li>)}
          </ul>
        </div>
      )}
      <div className="pc-pair">
        <label id={`${base}-organization`}>
          <span className="pc-field-label">Organization</span>
          <span className="pc-hint">Required. The company or project owner.</span>
          <input name="organization" autoComplete="organization" value={form.organization} aria-invalid={Boolean(message('organization'))} aria-describedby={describedBy('organization')} onChange={event => update('organization', event.target.value)} />
          <FieldError id={`${base}-organization-error`} message={message('organization')} />
        </label>
        <label id={`${base}-contactName`}>
          <span className="pc-field-label">Contact name</span>
          <span className="pc-hint">Required.</span>
          <input name="name" autoComplete="name" value={form.contactName} aria-invalid={Boolean(message('contactName'))} aria-describedby={describedBy('contactName')} onChange={event => update('contactName', event.target.value)} />
          <FieldError id={`${base}-contactName-error`} message={message('contactName')} />
        </label>
      </div>
      <label id={`${base}-workEmail`}>
        <span className="pc-field-label">Work email</span>
        <span className="pc-hint" id={`${base}-email-hint`}>Required. A personal mailbox can continue only as an item for human review.</span>
        <input name="email" type="email" autoComplete="email" inputMode="email" value={form.workEmail} aria-invalid={Boolean(message('workEmail'))} aria-describedby={describedBy('workEmail', `${base}-email-hint`)} onChange={event => update('workEmail', event.target.value)} />
        <FieldError id={`${base}-workEmail-error`} message={message('workEmail')} />
      </label>
      {personalEmail && <button className="pc-quiet-button" type="button" onClick={() => update('allowPersonalEmail', true)}>Use this email only for human review</button>}
      <div className="pc-pair">
        <label id={`${base}-state`}>
          <span className="pc-field-label">State</span>
          <span className="pc-hint">Required. Service in a state is not promised by selecting it.</span>
          <select name="state" autoComplete="address-level1" value={form.state} aria-invalid={Boolean(message('state'))} aria-describedby={describedBy('state')} onChange={event => update('state', event.target.value)}>
            <option value="">Select a state</option>
            {US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
          <FieldError id={`${base}-state-error`} message={message('state')} />
        </label>
        <label id={`${base}-zip`}>
          <span className="pc-field-label">ZIP code</span>
          <span className="pc-hint">Required. Checked against published ZIP prefixes, not a full postal database.</span>
          <input name="postal-code" autoComplete="postal-code" inputMode="numeric" value={form.zip} aria-invalid={Boolean(message('zip'))} aria-describedby={describedBy('zip')} onChange={event => update('zip', event.target.value)} />
          <FieldError id={`${base}-zip-error`} message={message('zip')} />
        </label>
      </div>
      <fieldset id={`${base}-transport`}>
        <legend>Transport</legend>
        <span className="pc-hint">Required. Pickup asks for a street address. Drop-off does not reserve a receiving site.</span>
        {(['pickup', 'dropoff'] as const).map(value => (
          <label className="pc-check" key={value}>
            <input type="radio" name="transport" value={value} checked={form.transport === value} onChange={() => update('transport', value)} />
            <span>{value === 'pickup' ? 'Pickup at the site' : 'Drop-off, if a site is confirmed later'}</span>
          </label>
        ))}
        <FieldError id={`${base}-transport-error`} message={message('transport')} />
      </fieldset>
      <div className="pc-pair">
        <label id={`${base}-panelType`}>
          <span className="pc-field-label">Panel type</span>
          <select value={form.panelType} aria-invalid={Boolean(message('panelType'))} aria-describedby={describedBy('panelType')} onChange={event => update('panelType', event.target.value as IntakeInput['panelType'])}>
            <option value="">Select a type</option>
            {PANEL_TYPES.map(value => <option key={value} value={value}>{value.replace('-', ' ')}</option>)}
          </select>
          <FieldError id={`${base}-panelType-error`} message={message('panelType')} />
        </label>
        <label id={`${base}-condition`}>
          <span className="pc-field-label">Condition</span>
          <select value={form.condition} aria-invalid={Boolean(message('condition'))} aria-describedby={describedBy('condition')} onChange={event => update('condition', event.target.value as IntakeInput['condition'])}>
            <option value="">Select a condition</option>
            {CONDITIONS.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <FieldError id={`${base}-condition-error`} message={message('condition')} />
        </label>
      </div>
      <div className="pc-pair">
        <label id={`${base}-count`}>
          <span className="pc-field-label">Panel count</span>
          <span className="pc-hint">Enter a count, a weight, or both.</span>
          <input inputMode="numeric" value={form.count} aria-invalid={Boolean(message('count'))} aria-describedby={describedBy('count')} onChange={event => update('count', event.target.value)} />
          <FieldError id={`${base}-count-error`} message={message('count')} />
        </label>
        <label id={`${base}-weight`}>
          <span className="pc-field-label">Weight</span>
          <input inputMode="decimal" value={form.weight} aria-invalid={Boolean(message('weight'))} aria-describedby={describedBy('weight')} onChange={event => update('weight', event.target.value)} />
          <FieldError id={`${base}-weight-error`} message={message('weight')} />
        </label>
      </div>
      <label id={`${base}-weightUnit`}>
        <span className="pc-field-label">Weight unit</span>
        <span className="pc-hint">Required only when you enter a weight.</span>
        <select value={form.weightUnit} aria-invalid={Boolean(message('weightUnit'))} aria-describedby={describedBy('weightUnit')} onChange={event => update('weightUnit', event.target.value as IntakeInput['weightUnit'])}>
          <option value="">No weight entered</option>
          {WEIGHT_UNITS.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <FieldError id={`${base}-weightUnit-error`} message={message('weightUnit')} />
      </label>
      <label id={`${base}-packaging`}>
        <span className="pc-field-label">Packaging</span>
        <select value={form.packaging} aria-invalid={Boolean(message('packaging'))} aria-describedby={describedBy('packaging')} onChange={event => update('packaging', event.target.value as IntakeInput['packaging'])}>
          <option value="">Select packaging</option>
          {PACKAGING.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <FieldError id={`${base}-packaging-error`} message={message('packaging')} />
      </label>
      {showPhotos && (
        <fieldset id={`${base}-canSharePhotos`}>
          <legend>Photos during review</legend>
          <span className="pc-hint">Required for damaged, mixed, unknown, or thin-film loads. This preview does not upload files.</span>
          <label className="pc-check"><input type="radio" name="photos" checked={form.canSharePhotos === 'yes'} onChange={() => update('canSharePhotos', 'yes')} /><span>Photos can be shared later through an approved channel</span></label>
          <label className="pc-check"><input type="radio" name="photos" checked={form.canSharePhotos === 'no'} onChange={() => update('canSharePhotos', 'no')} /><span>Photos are not available</span></label>
          <FieldError id={`${base}-canSharePhotos-error`} message={message('canSharePhotos')} />
        </fieldset>
      )}
      {showPickup && (
        <>
          <label id={`${base}-loading`}>
            <span className="pc-field-label">Loading at the site</span>
            <span className="pc-hint">Required for pickup.</span>
            <select value={form.loading} aria-invalid={Boolean(message('loading'))} aria-describedby={describedBy('loading')} onChange={event => update('loading', event.target.value as IntakeInput['loading'])}>
              <option value="">Select loading</option>
              {LOADING_OPTIONS.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <FieldError id={`${base}-loading-error`} message={message('loading')} />
          </label>
          <label id={`${base}-pickupAddress`}>
            <span className="pc-field-label">Pickup street address</span>
            <span className="pc-hint">Required for pickup. Kept only in this preview summary. It does not schedule a truck.</span>
            <input autoComplete="street-address" value={form.pickupAddress} aria-invalid={Boolean(message('pickupAddress'))} aria-describedby={describedBy('pickupAddress')} onChange={event => update('pickupAddress', event.target.value)} />
            <FieldError id={`${base}-pickupAddress-error`} message={message('pickupAddress')} />
          </label>
        </>
      )}
      <label id={`${base}-desiredDate`}>
        <span className="pc-field-label">Preferred date</span>
        <span className="pc-hint" id={`${base}-date-hint`}>Optional. A date is a preference, not a scheduled pickup or a promised window.</span>
        <input type="date" value={form.desiredDate} aria-invalid={Boolean(message('desiredDate'))} aria-describedby={describedBy('desiredDate', `${base}-date-hint`)} onChange={event => update('desiredDate', event.target.value)} />
        <FieldError id={`${base}-desiredDate-error`} message={message('desiredDate')} />
      </label>
      <label className="pc-check" id={`${base}-inquiryConsent`}>
        <input type="checkbox" checked={form.inquiryConsent} aria-invalid={Boolean(message('inquiryConsent'))} onChange={event => update('inquiryConsent', event.target.checked)} />
        <span>I understand this is a website preview. It is not submitted, not an order, and PV Circonomy has not received it.</span>
      </label>
      <FieldError id={`${base}-inquiryConsent-error`} message={message('inquiryConsent')} />
      <label className="pc-check">
        <input type="checkbox" checked={form.marketingOptIn} onChange={event => update('marketingOptIn', event.target.checked)} />
        <span>Email me about PV Circonomy updates. Leave this unchecked if you do not want that. This preview does not subscribe you or create a contact.</span>
      </label>
      <button className="pc-button" type="submit">Review this preview inquiry</button>
      {personalEmail && form.allowPersonalEmail && <p className="pc-hint">Personal email marked for human review. Submit again to refresh the preview summary.</p>}
      {draft && (
        <div className="pc-draft-result" role="status" tabIndex={-1} ref={summaryRef}>
          <strong className="pc-not-submitted">{draft.referenceLabel}</strong>
          <p>No case was created. Status stays at a local draft for human review.</p>
          <dl className="pc-summary-dl">
            <dt>Organization</dt><dd>{draft.summary.organization}</dd>
            <dt>Contact</dt><dd>{draft.summary.contactName}</dd>
            <dt>Work email</dt><dd>{draft.summary.workEmail}</dd>
            <dt>Origin</dt><dd>{draft.summary.state} {draft.summary.zip}</dd>
            <dt>Transport</dt><dd>{draft.summary.transport}</dd>
            <dt>Panels</dt><dd>{draft.summary.panelType}, {draft.summary.condition}</dd>
            <dt>Quantity</dt><dd>{[draft.summary.count ? `${draft.summary.count} panels` : '', draft.summary.weight ? `${draft.summary.weight} ${draft.summary.weightUnit}` : ''].filter(Boolean).join('; ')}</dd>
            <dt>Packaging</dt><dd>{draft.summary.packaging}</dd>
            {draft.summary.pickupAddress && <><dt>Pickup address</dt><dd>{draft.summary.pickupAddress}</dd></>}
            {draft.summary.loading && <><dt>Loading</dt><dd>{draft.summary.loading}</dd></>}
            <dt>Preferred date</dt><dd>{draft.summary.desiredDate ?? 'None. No schedule is held.'}</dd>
            <dt>Marketing email</dt><dd>{draft.summary.marketingOptIn ? 'Requested in this preview only. No subscription was created.' : 'Not requested.'}</dd>
          </dl>
          <h3>A reviewer would still need to resolve</h3>
          <ul>{draft.exceptions.map(item => <li key={item.code}>{item.message}</li>)}</ul>
          <h3>Next steps</h3>
          <ol>{draft.nextSteps.map(step => <li key={step}>{step}</li>)}</ol>
        </div>
      )}
      <div>
        <p id={`${base}-locked`}>Payment, acceptance, logistics, and documents stay off until a trusted system records an approved quote. This page cannot do that.</p>
        <div className="pc-locked-actions">
          {FRONTEND_COMMERCIAL_ACTIONS.map(action => (
            <button key={action} type="button" disabled aria-describedby={`${base}-locked`}>{ACTION_LABELS[action]}</button>
          ))}
        </div>
        <button className="pc-quiet-button" type="button" onClick={() => setRefusal(frontendTransition('approve_quote').message)}>See why a quote cannot be approved here</button>
        {refusal && <p role="status">{refusal}</p>}
      </div>
    </form>
  );
}
