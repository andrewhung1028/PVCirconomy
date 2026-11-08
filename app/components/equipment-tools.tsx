'use client';

import { useState, type FormEvent } from 'react';
import { recordPreviewEvent } from '@/lib/journey/events';
import {
  SCENARIO_CONFIGS,
  TECHNICAL_ROLES,
  US_STATES,
  emptyTechnical,
  reviewScenario,
  validateTechnicalRequest,
  type TechnicalInput,
} from '@/lib/journey/intake';

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <span id={id} className="pc-field-error">{message}</span>;
}

export function ScenarioReview() {
  const [configuration, setConfiguration] = useState<(typeof SCENARIO_CONFIGS)[number] | ''>('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = reviewScenario({ configuration, acknowledged });
    if (!result.ok) {
      setMessage('');
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setMessage(result.message);
    recordPreviewEvent({ name: 'scenario_valid', configuration: result.configuration });
  }

  return (
    <form className="pc-journey-form" onSubmit={onSubmit} noValidate>
      <label>
        <span className="pc-field-label">Published configuration name</span>
        <span className="pc-hint">These names are already on the public site. Choosing one does not reserve equipment.</span>
        <select value={configuration} aria-invalid={errors.some(error => error.field === 'configuration')} onChange={event => setConfiguration(event.target.value as typeof configuration)}>
          <option value="">Select one</option>
          {SCENARIO_CONFIGS.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <FieldError id="scenario-configuration-error" message={errors.find(error => error.field === 'configuration')?.message} />
      </label>
      <label className="pc-check">
        <input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} />
        <span>I understand this is a published name, not an approved operating case, a measured throughput, or a price.</span>
      </label>
      <FieldError id="scenario-ack-error" message={errors.find(error => error.field === 'acknowledged')?.message} />
      <button className="pc-button" type="submit">Mark scenario reviewed</button>
      {message && <p className="pc-draft-result" role="status"><strong className="pc-not-submitted">Not a commercial case</strong><br />{message}</p>}
    </form>
  );
}

export function TechnicalRequestForm() {
  const [form, setForm] = useState<TechnicalInput>(emptyTechnical);
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const [done, setDone] = useState(false);

  function update<K extends keyof TechnicalInput>(key: K, value: TechnicalInput[K]) {
    setForm(current => ({ ...current, [key]: value }));
    setDone(false);
  }

  function message(field: string) {
    return errors.find(error => error.field === field)?.message;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateTechnicalRequest(form);
    if (!result.ok) {
      setDone(false);
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setDone(true);
    recordPreviewEvent({ name: 'technical_request' });
  }

  const personal = message('workEmail')?.includes('personal mailbox');

  return (
    <form className="pc-journey-form" onSubmit={onSubmit} noValidate>
      <p className="pc-hint">This request stays in the page. It does not open an assessment, create a contact, or send email.</p>
      <div className="pc-pair">
        <label>
          <span className="pc-field-label">Organization</span>
          <input autoComplete="organization" value={form.organization} aria-invalid={Boolean(message('organization'))} onChange={event => update('organization', event.target.value)} />
          <FieldError id="tech-org-error" message={message('organization')} />
        </label>
        <label>
          <span className="pc-field-label">Contact name</span>
          <input autoComplete="name" value={form.contactName} aria-invalid={Boolean(message('contactName'))} onChange={event => update('contactName', event.target.value)} />
          <FieldError id="tech-name-error" message={message('contactName')} />
        </label>
      </div>
      <label>
        <span className="pc-field-label">Work email</span>
        <input type="email" autoComplete="email" value={form.workEmail} aria-invalid={Boolean(message('workEmail'))} onChange={event => update('workEmail', event.target.value)} />
        <FieldError id="tech-email-error" message={message('workEmail')} />
      </label>
      {personal && <button type="button" className="pc-quiet-button" onClick={() => update('allowPersonalEmail', true)}>Use this email only for human review</button>}
      <div className="pc-pair">
        <label>
          <span className="pc-field-label">State</span>
          <select autoComplete="address-level1" value={form.state} aria-invalid={Boolean(message('state'))} onChange={event => update('state', event.target.value)}>
            <option value="">Select a state</option>
            {US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
          <FieldError id="tech-state-error" message={message('state')} />
        </label>
        <label>
          <span className="pc-field-label">Operation</span>
          <select value={form.role} aria-invalid={Boolean(message('role'))} onChange={event => update('role', event.target.value as TechnicalInput['role'])}>
            <option value="">Select one</option>
            {TECHNICAL_ROLES.map(value => <option key={value} value={value}>{value.replace(/-/g, ' ')}</option>)}
          </select>
          <FieldError id="tech-role-error" message={message('role')} />
        </label>
      </div>
      <label>
        <span className="pc-field-label">What do you want reviewed?</span>
        <span className="pc-hint">Optional. Do not include customer names, prices, or account numbers.</span>
        <textarea value={form.note} aria-invalid={Boolean(message('note'))} onChange={event => update('note', event.target.value)} />
        <FieldError id="tech-note-error" message={message('note')} />
      </label>
      <label className="pc-check">
        <input type="checkbox" checked={form.inquiryConsent} onChange={event => update('inquiryConsent', event.target.checked)} />
        <span>I understand this technical request is a preview. It is not submitted and does not start an assessment.</span>
      </label>
      <FieldError id="tech-consent-error" message={message('inquiryConsent')} />
      <label className="pc-check">
        <input type="checkbox" checked={form.marketingOptIn} onChange={event => update('marketingOptIn', event.target.checked)} />
        <span>Email me about PV Circonomy updates. Unchecked by default. This preview does not create a subscription.</span>
      </label>
      <button className="pc-button" type="submit">Review technical request</button>
      {done && <p className="pc-draft-result" role="status"><strong className="pc-not-submitted">Preview reference — not submitted</strong><br />The request stayed on this page. No assessment file was opened.</p>}
    </form>
  );
}
