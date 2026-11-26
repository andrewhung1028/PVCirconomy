'use client';
import {usePricing} from './use-pricing';
import { useEffect, useState } from 'react';
import type { QuoteInput } from '../../lib/recycling-quote';
import { estimateProcessing } from '../../lib/batch-quote';
import './recycling-quote.css';
const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
export function RecyclingQuote() {
  const [quantity, setQuantity] = useState('300');
  const [watts, setWatts] = useState('350');
  const [scale, setScale] = useState<QuoteInput['scale']>('truck');
  const [condition, setCondition] = useState<QuoteInput['condition']>('complete');
  const [model, setModel] = useState('');
  const [delivery, setDelivery] = useState('dropoff');
  const [zip, setZip] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [modelStatus, setModelStatus] = useState('');
  const [matches, setMatches] = useState<Array<{id: string; manufacturer: string; model: string; rated_watts: number}>>([]);
  async function lookupModel() {
    setLookingUp(true); setModelStatus('Looking up verified models…'); setMatches([]);
    try {
      const response = await fetch('/api/panel-models/?q=' + encodeURIComponent(model));
      if (!response.ok) throw new Error();
      const data = await response.json(); setMatches(data.models);
      setModelStatus(data.models.length ? 'Select the matching model. Verify it against your label.' : 'No verified match. Enter specifications manually; model confirmation is still required.');
    } catch { setModelStatus('Model lookup is unavailable. Your entries are preserved; enter the rated watts printed on your label to continue.'); }
    finally { setLookingUp(false); }
  }
  async function saveEstimate() {
    if (!/^\d{5}$/.test(zip)) { setSaveStatus('Enter a 5-digit US ZIP code before saving.'); return; }
    setSaving(true); setSaveStatus('Saving estimate…');
    try {
      const response = await fetch('/api/estimates/', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({quantity:Number(quantity),watts:Number(watts),scale,condition,model,delivery,zip}) });
      if (!response.ok) throw new Error();
      const result = await response.json(); setSaveStatus('Saved estimate reference: ' + result.id + '. This is not a formal quote or booking.');
    } catch { setSaveStatus('Estimate could not be saved. Your entries remain here; you can download the worksheet instead.'); }
    finally { setSaving(false); }
  }
  const {pricing,pricingError,loading,refresh}=usePricing();
  const quote = pricing?estimateProcessing({ quantity: Number(quantity), watts: Number(watts), scale, condition },pricing):{total:null,reason:loading?'Loading current rates…':'Current rates unavailable.',rate:undefined,unit:undefined,weight:undefined,qualificationNote:undefined,processingScale:undefined};
  useEffect(() => { if (!photo) { setPhotoUrl(''); return; } const url = URL.createObjectURL(photo); setPhotoUrl(url); return () => URL.revokeObjectURL(url); }, [photo]);
  useEffect(() => { setShowSummary(false); setSaveStatus(''); }, [quantity, watts, scale, condition, model, delivery, zip, photo]);
  function example(q: string, w: string, s: QuoteInput['scale']) { setQuantity(q); setWatts(w); setScale(s); setCondition('complete'); }
  function download() {
    const text = `PV Circonomy — estimate worksheet, not a formal quote\nModel: ${model || 'Not verified'}\nPanels: ${quantity}\nRated watts: ${watts}\nCondition: ${condition}\nProcessing tier: ${quote.processingScale==='residential'?'Residential':quote.processingScale==='trailer'?'Trailer':'Truck'}\nBasis: ${quote.qualificationNote??'Pending'}\nDelivery: ${delivery}\nUS ZIP: ${zip || 'Not provided'}\nProcessing estimate: ${quote.total === null ? 'Rate confirmation required' : money(quote.total)}\nTransport: quoted separately. Tax: to be confirmed.\nComplete-panel pricing already applied. No additional discount deducted.\nTrailer final billing uses scale weight including pallets and packaging.\nNo request, booking or payment has been submitted.\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); const a = document.createElement('a'); a.href = url; a.download = 'pv-circonomy-estimate.txt'; a.click(); URL.revokeObjectURL(url);
  }
  return <section className="rq pc-wrap">
    <header className="rq-heading"><h1>Explore your<br className="rq-desktop-break" /> recycling estimate.</h1><p>Have your model or rated watts, panel count and condition ready. Explore current wattage-based rates, then adjust the details.</p><p className="rq-preview">Current processing estimate · USD · United States only</p></header>
    {pricingError&&<p role="alert">{pricingError}<button onClick={()=>void refresh()}>Retry pricing</button></p>}<nav className="rq-steps" aria-label="Estimate sections"><a href="#rq-panels"><span>1</span> Panels</a><a href="#rq-delivery"><span>2</span> Delivery</a><a href="#rq-estimate"><span>3</span> Estimate</a></nav>
    <div className="rq-layout"><div className="rq-inputs">
      <section id="rq-panels" className="rq-section"><h2>Your panels</h2><div className="rq-panel-summary"><img src="/images/feedstock-intact.png" alt="Retired solar panels, illustrative of the service rather than your selected model" /><div><strong>{watts || '—'} W · {quantity || '—'} panels</strong><p>One model per batch. Mixed models need a separate review.</p></div></div>
        <label>Manufacturer &amp; model <span>(optional if rated watts are known)</span><input value={model} onChange={e => setModel(e.target.value)} placeholder="Enter the model shown on the label" maxLength={160} /></label>
        <p className="rq-help">Search the verified model database, or enter specifications manually. Photo AI recognition is not connected.</p>
        <button type="button" className="rq-secondary" disabled={model.trim().length < 2 || lookingUp} onClick={lookupModel}>{lookingUp ? 'Finding model…' : 'Find model specifications'}</button><p className="rq-help" role="status">{modelStatus}</p>{matches.length > 0 && <ul className="rq-models">{matches.map(m => <li key={m.id}><button type="button" onClick={() => { setModel(m.manufacturer + ' ' + m.model); setWatts(String(m.rated_watts)); setMatches([]); setModelStatus('Model selected. Confirm the label matches before proceeding.'); }}>{m.manufacturer} {m.model} · {m.rated_watts} W</button></li>)}</ul>}
        <label className="rq-upload">Preview a label photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const file = e.target.files?.[0]; setPhotoError(''); if (file && file.size <= 10 * 1024 * 1024 && ['image/jpeg','image/png','image/webp'].includes(file.type)) setPhoto(file); else { if (file) setPhotoError('Choose a JPG, PNG or WebP image no larger than 10 MB.'); e.target.value = ''; } }} /><span>JPG, PNG or WebP · up to 10 MB. Stays in this browser; not analyzed or sent.</span></label>
        {photoError && <p className="rq-help" role="alert">{photoError}</p>}
        {photoUrl && <div className="rq-photo"><img src={photoUrl} alt="Your selected panel label preview" /><button type="button" onClick={() => setPhoto(null)}>Remove photo</button></div>}
        <div className="rq-pair"><label>Panel count<input type="number" min="1" max="1000000" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} /></label><label>Rated power (W)<input type="number" min="1" max="2000" step="1" value={watts} onChange={e => setWatts(e.target.value)} /></label></div>
        <label>Panel condition<select value={condition} onChange={e => setCondition(e.target.value as QuoteInput['condition'])}><option value="complete">Glass intact, frame &amp; junction box present</option><option value="broken">Glass broken</option><option value="missing-box">Junction box missing</option><option value="missing-frame">Frame missing</option><option value="missing-both">Frame &amp; junction box missing</option></select></label>
        <p className="rq-help">No separate double-glass surcharge. Model structure cannot be inferred from wattage alone.</p>
      </section>
      <section id="rq-delivery" className="rq-section"><h2>Delivery</h2><fieldset><legend>Shipment scale</legend><div className="rq-options">{(['truck','trailer'] as const).map(s => <label key={s}><input type="radio" name="scale" checked={scale === s} onChange={() => setScale(s)} />{s === 'truck' ? 'Truck · per panel' : 'Trailer · per lb'}</label>)}</div></fieldset>
        <fieldset><legend>Delivery method</legend><div className="rq-options"><label><input type="radio" name="delivery" checked={delivery === 'dropoff'} onChange={() => setDelivery('dropoff')} />Self-arranged delivery</label><label><input type="radio" name="delivery" checked={delivery === 'pickup'} onChange={() => setDelivery('pickup')} />Request pickup pricing</label></div></fieldset>
        <label>US ZIP code<input inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" maxLength={5} value={zip} onChange={e => setZip(e.target.value.replace(/\D/g, ''))} placeholder="5-digit ZIP" aria-describedby="rq-zip-help" /></label><p id="rq-zip-help" className="rq-help">Service availability and transport require confirmation. A US ZIP does not guarantee pickup coverage.</p>
      </section>
    </div>
    <aside id="rq-estimate" className="rq-estimate"><h2>Processing estimate</h2><p className="rq-example-notice">Processing estimate using current rates; transport and taxes are separate.</p><div aria-live="polite" aria-atomic="true"><p className={'rq-total' + (quote.total === null ? ' rq-review' : '')}>{quote.total === null ? 'Complete your quotation details' : money(quote.total)}</p>{quote.reason && <p className="rq-reason">{quote.reason}</p>}</div>
      <dl className="rq-costs"><div><dt>{quote.unit === 'lb' ? 'Estimated panel weight' : 'Panel count'}</dt><dd>{quote.weight ? `${quote.weight.toLocaleString()} lb` : quantity || '—'}</dd></div><div><dt>Processing rate</dt><dd>{quote.rate !== undefined ? `${money(quote.rate)} / ${quote.unit}` : 'To be confirmed'}</dd></div><div><dt>Transport</dt><dd>Quoted separately</dd></div><div><dt>Tax</dt><dd>To be confirmed</dd></div></dl>
      {scale === 'trailer' && <p className="rq-help"><strong>Estimated panel weight only.</strong> Packaging is not included in this estimate. Final billing uses actual scale weight including pallets and packaging.</p>}
      <p className="rq-help">{quote.qualificationNote}</p><p className="rq-help">Trailer totals require model weight or dimensions. Use the homepage estimator for mixed batches and a dated quotation.</p>
      {condition === 'complete' ? <div className="rq-benefit"><strong>{quote.total === null ? 'Complete-panel condition selected' : 'Complete-panel pricing applied'}</strong><p>Glass intact, frame and junction box present. No condition surcharge applies.</p></div> : <div className="rq-benefit"><strong>Condition surcharge applied</strong><p>Condition surcharges use current prices and apply only to affected processing charges. For combined conditions, use the homepage estimator.</p></div>}
      <button className="rq-primary" type="button" disabled={!pricing||loading} onClick={() => setShowSummary(true)}>Prepare quote details</button><p className="rq-help rq-centered">View estimates without sharing contact details.</p>
      {showSummary && <div className="rq-next" role="status"><strong>Details ready for your records</strong><p>Save an estimate reference or download your worksheet. Saving stores panel and delivery details, not the photo. It does not issue a formal quote, request a pickup, or create a booking or payment.</p><button type="button" className="rq-secondary" onClick={saveEstimate} disabled={saving}>{saving ? 'Saving…' : 'Save estimate reference'}</button><p role="status">{saveStatus}</p><button type="button" className="rq-secondary" onClick={download}>Download estimate worksheet</button></div>}
    </aside></div>
    <section className="rq-examples"><h2>Quick-fill panel quantities</h2><p>These quantities use current pricing rules. Trailer settlement requires weight information.</p><div><button onClick={() => example('300','350','truck')}>300 × 350 W · Truck</button><button onClick={() => example('150','450','truck')}>150 × 450 W · Truck</button><button onClick={() => example('7000','275','trailer')}>7,000 × 275 W · Trailer</button></div></section>
    <div className="rq-notes"><p><strong>Trailer settlement.</strong> Final billing uses actual scale weight, including pallets and packaging. No default panel weight is assumed. Third-party scale tickets are accepted.</p><p><strong>Scheduled batches.</strong> Deliveries may be scheduled in batches seven days apart, with agreed dates, quantities and minimum-volume conditions. Dates and availability require confirmation.</p><p><strong>Receiving checks.</strong> If condition differs from your description, affected quantities and price changes are documented with photos for your approval before processing.</p><p>PV Circonomy uses PV Circulator technology, developed by its parent company TSGC.</p></div>
  </section>;
}
