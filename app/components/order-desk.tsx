'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { US_STATES } from '@/lib/journey/intake';
import { calculateScenario, createTestOrder, estimateService, liveSnapshot, orderSummaryText, type TestOrder } from '@/lib/commerce/model';
import { useReview } from './review-provider';

export function OrderDesk() {
  const router = useRouter();
  const { session, patchService, patchEquipment, saveOrder } = useReview();
  const [estimatesNotFinal, setEstimatesNotFinal] = useState(false);
  const [testOnly, setTestOnly] = useState(false);
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const serviceReady = session.serviceStatus !== 'draft';
  const equipmentReady = session.equipmentStatus !== 'draft';
  const serviceEstimate = serviceReady ? estimateService(session.service) : null;
  const snapshot = liveSnapshot(session, new Date().toISOString());
  const fresh = snapshot ? calculateScenario(snapshot.inputs) : null;

  function submit() {
    const shared = serviceReady ? session.service : session.equipment;
    if (serviceReady) patchService({ organization: shared.organization, contactName: shared.contactName, workEmail: shared.workEmail, phone: shared.phone, state: shared.state });
    if (equipmentReady) patchEquipment({ organization: shared.organization, contactName: shared.contactName, workEmail: shared.workEmail, phone: shared.phone, state: shared.state });
    const next = {
      ...session,
      service: serviceReady ? { ...session.service, organization: shared.organization, contactName: shared.contactName, workEmail: shared.workEmail, phone: shared.phone, state: shared.state } : session.service,
      equipment: equipmentReady ? { ...session.equipment, organization: shared.organization, contactName: shared.contactName, workEmail: shared.workEmail, phone: shared.phone, state: shared.state } : session.equipment,
    };
    const result = createTestOrder(next, { now: new Date().toISOString(), id: Math.random().toString(36).slice(2, 6).toUpperCase(), estimatesNotFinal, testOnly });
    if (!result.ok) { setErrors(result.errors); return; }
    saveOrder(result.order);
    router.push('/order/complete');
  }

  return <div className="pc-wizard">
    {!serviceReady && !equipmentReady && <p>Choose a <Link href="/services/solar-panel-recycling">recycling request</Link> or an <Link href="/equipment">equipment request</Link> before creating a test order. What you already entered is kept in this browser.</p>}
    {errors.length > 0 && <div className="pc-error-summary" role="alert"><h2>The test order needs a correction</h2><ul>{errors.map(error => <li key={`${error.field}-${error.message}`}>{error.message}</li>)}</ul></div>}
    {serviceReady && <section className="pc-journey-section"><h2>Recycling request</h2><p>{session.service.organization || 'Organization not entered'} · {session.service.panelType || 'type open'} · {session.service.state} {session.service.zip}</p>
      {serviceEstimate?.ok && <>
        <h3>Estimated known charges</h3>
        {serviceEstimate.estimate.knownTotal === null ? <p>None calculated.</p> : <p className="pc-total">{serviceEstimate.estimate.knownTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>}
        <ul>{serviceEstimate.estimate.known.map(line => <li key={line.label}>{line.label}: {line.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}. {line.detail}</li>)}</ul>
        <h3>Additional items require a quote</h3>
        <ul>{serviceEstimate.estimate.quoted.map(item => <li key={item.label}>{item.label}: {item.detail}</li>)}</ul>
      </>}
      <p className="pc-hint">This service estimate is separate from an equipment operator’s intake-fee assumption.</p>
    </section>}
    {equipmentReady && <section className="pc-journey-section"><h2>Equipment request</h2><p>{session.equipment.product === 'jb-tool' ? 'JB Tool' : 'PV Circulator'} · {session.equipment.organization || 'Organization not entered'} · {session.equipment.state} {session.equipment.zip}</p>
      <h3>Quoted after review</h3>
      <ul><li>Equipment</li><li>Installation</li><li>Freight</li><li>Trade terms</li><li>Training</li><li>Warranty</li><li>Taxes</li></ul>
      {fresh?.ok && <div><h3>Scenario snapshot</h3><p>Model recalculated from the assumptions currently in this browser. Monthly surplus: {fresh.result.monthlySurplus === null ? 'not calculated' : fresh.result.monthlySurplus.toLocaleString('en-US', { style: 'currency', currency: fresh.result.currency })}. {fresh.result.paybackMessage || `Simple payback ${fresh.result.paybackMonths?.toFixed(1)} months.`} Scenario capex is not a TSGC offered price.</p></div>}
    </section>}
    <div className="pc-journey-form">
      <h2>Contact</h2>
      <div className="pc-pair"><label><span className="pc-field-label">Organization</span><input value={serviceReady ? session.service.organization : session.equipment.organization} onChange={event => { if (serviceReady) patchService({ organization: event.target.value }); if (equipmentReady) patchEquipment({ organization: event.target.value }); }} /></label><label><span className="pc-field-label">Contact name</span><input value={serviceReady ? session.service.contactName : session.equipment.contactName} onChange={event => { if (serviceReady) patchService({ contactName: event.target.value }); if (equipmentReady) patchEquipment({ contactName: event.target.value }); }} /></label></div>
      <div className="pc-pair"><label><span className="pc-field-label">Work email</span><input type="email" autoComplete="email" value={serviceReady ? session.service.workEmail : session.equipment.workEmail} onChange={event => { if (serviceReady) patchService({ workEmail: event.target.value }); if (equipmentReady) patchEquipment({ workEmail: event.target.value }); }} /></label><label><span className="pc-field-label">Phone</span><span className="pc-hint">Optional.</span><input autoComplete="tel" value={serviceReady ? session.service.phone : session.equipment.phone} onChange={event => { if (serviceReady) patchService({ phone: event.target.value }); if (equipmentReady) patchEquipment({ phone: event.target.value }); }} /></label></div>
      <label><span className="pc-field-label">State</span><select value={serviceReady ? session.service.state : session.equipment.state} onChange={event => { if (serviceReady) patchService({ state: event.target.value }); if (equipmentReady) patchEquipment({ state: event.target.value }); }}>{US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
      <label className="pc-check"><input type="checkbox" checked={estimatesNotFinal} onChange={event => setEstimatesNotFinal(event.target.checked)} /><span>These estimates are not a final written quote.</span></label>
      <label className="pc-check"><input type="checkbox" checked={testOnly} onChange={event => setTestOnly(event.target.checked)} /><span>This is a test only. It does not take payment or arrange pickup, shipment, or fulfillment.</span></label>
      <button className="pc-button" type="button" onClick={submit}>Create test order</button>
    </div>
  </div>;
}

export function OrderComplete() {
  const { session, clearOrder, reset } = useReview();
  const order: TestOrder | null = session.order;
  if (!order) return <p>There is no test order in this browser. <Link href="/order">Return to the summary</Link>.</p>;
  function download() {
    const blob = new Blob([orderSummaryText(order!)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${order!.reference}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return <div className="pc-wizard">
    <p className="pc-kicker">{order.kind}</p>
    <h2>{order.reference}</h2>
    <p><strong>This review-mode order has not been sent to our team. No payment, pickup or shipment has been arranged.</strong></p>
    <p>Status: test created. Kept in this browser for this review.</p>
    <pre className="pc-summary-text">{orderSummaryText(order)}</pre>
    <div className="pc-inline-links">
      <button className="pc-button" type="button" onClick={download}>Download summary</button>
      <Link className="pc-quiet-button" href="/order" onClick={() => clearOrder()}>Edit request</Link>
      <button className="pc-quiet-button" type="button" onClick={reset}>Start another</button>
    </div>
  </div>;
}
