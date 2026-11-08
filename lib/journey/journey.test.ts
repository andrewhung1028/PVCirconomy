import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { businessCaseHref, buildJourneyHref, publicPath, readJourneyContext } from './context';
import { approvalChecklist, evidenceIndex } from './evidence';
import { previewEventLog, recordPreviewEvent, resetPreviewEvents } from './events';
import {
  ZIP3_RANGES,
  emptyIntake,
  fictionalPreviewDraft,
  normalizeState,
  reviewScenario,
  validateIntake,
  validateTechnicalRequest,
  zipPrefixState,
} from './intake';
import { journeyRoutes } from './routes';
import { FRONTEND_COMMERCIAL_ACTIONS, frontendTransition } from './states';

test('ZIP prefixes do not overlap and map known examples', () => {
  for (let i = 0; i < ZIP3_RANGES.length; i += 1) {
    for (let j = i + 1; j < ZIP3_RANGES.length; j += 1) {
      const [a0, a1] = ZIP3_RANGES[i];
      const [b0, b1] = ZIP3_RANGES[j];
      assert.ok(a1 < b0 || b1 < a0, `${a0}-${a1} overlaps ${b0}-${b1}`);
    }
  }
  assert.equal(zipPrefixState('90210'), 'CA');
  assert.equal(zipPrefixState('94105-1234'), 'CA');
  assert.equal(zipPrefixState('10001'), 'NY');
  assert.equal(zipPrefixState('02139'), 'MA');
  assert.equal(zipPrefixState('60614'), 'IL');
  assert.equal(zipPrefixState('98101'), 'WA');
  assert.equal(zipPrefixState('33139'), 'FL');
  assert.equal(zipPrefixState('85004'), 'AZ');
  assert.equal(zipPrefixState('80202'), 'CO');
  assert.equal(zipPrefixState('30303'), 'GA');
  assert.equal(zipPrefixState('75201'), 'TX');
  assert.equal(zipPrefixState('73301'), 'TX');
  assert.equal(zipPrefixState('88510'), 'TX');
  assert.equal(zipPrefixState('97205'), 'OR');
  assert.equal(zipPrefixState('96815'), 'HI');
  assert.equal(zipPrefixState('99501'), 'AK');
  assert.equal(zipPrefixState('20001'), 'DC');
  assert.equal(zipPrefixState('20500'), 'DC');
  assert.equal(zipPrefixState('20171'), 'VA');
  assert.equal(zipPrefixState('abc'), 'invalid');
  assert.equal(zipPrefixState('1234'), 'invalid');
  assert.equal(zipPrefixState('00000'), 'invalid');
  assert.equal(zipPrefixState('00301'), 'unassigned');
  assert.equal(normalizeState('California'), 'CA');
  assert.equal(normalizeState('dc'), 'DC');
  assert.equal(normalizeState('XX'), null);
});

test('intake rejects incomplete, mismatched, and sensitive values without mutating input', () => {
  const original = { ...emptyIntake(), state: 'NY', zip: '90210', workEmail: 'not-an-email', count: '0', organization: '4111 1111 1111 1111' };
  const frozen = structuredClone(original);
  const result = validateIntake(original);
  assert.equal(result.ok, false);
  assert.deepEqual(original, frozen);
  if (result.ok) return;
  const fields = result.errors.map(error => error.field);
  assert.ok(fields.includes('organization'));
  assert.ok(fields.includes('workEmail'));
  assert.ok(fields.includes('zip'));
  assert.ok(fields.includes('count'));
  assert.ok(fields.includes('inquiryConsent'));
});

test('personal email can be recovered as an exception and still is not submitted', () => {
  const blocked = validateIntake({ ...fictionalPreviewDraft, workEmail: 'person@gmail.com', allowPersonalEmail: false });
  assert.equal(blocked.ok, false);
  const recovered = validateIntake({ ...fictionalPreviewDraft, workEmail: 'person@gmail.com', allowPersonalEmail: true });
  assert.equal(recovered.ok, true);
  if (!recovered.ok) return;
  assert.equal(recovered.draft.submitted, false);
  assert.equal(recovered.draft.caseCreated, false);
  assert.equal(recovered.draft.referenceLabel, 'Preview reference — not submitted');
  assert.ok(recovered.exceptions.some(item => item.code === 'personal_email'));
  assert.equal(recovered.value.marketingOptIn, false);
});

test('unknown condition, units, pickup address, and past dates follow the review rules', () => {
  const missingUnit = validateIntake({ ...fictionalPreviewDraft, count: '', weight: '1200', weightUnit: '', panelType: 'crystalline-silicon', condition: 'intact', canSharePhotos: '' });
  assert.equal(missingUnit.ok, false);
  if (!missingUnit.ok) assert.ok(missingUnit.errors.some(error => error.field === 'weightUnit'));

  const badUnit = validateIntake({ ...fictionalPreviewDraft, count: '', weight: '2', weightUnit: 'stone' as 'lb' });
  assert.equal(badUnit.ok, false);

  const byWeight = validateIntake({
    ...fictionalPreviewDraft,
    count: '',
    weight: '2.5',
    weightUnit: 'short-ton',
    panelType: 'crystalline-silicon',
    condition: 'intact',
    canSharePhotos: '',
    transport: 'dropoff',
    pickupAddress: '',
    loading: '',
  });
  assert.equal(byWeight.ok, true);
  if (byWeight.ok) {
    assert.equal(byWeight.value.pickupAddress, null);
    assert.equal(byWeight.value.weightUnit, 'short-ton');
    assert.ok(byWeight.exceptions.some(item => item.code === 'weight_basis'));
    assert.equal(byWeight.draft.quoteApproved, false);
  }

  const unknown = validateIntake(fictionalPreviewDraft);
  assert.equal(unknown.ok, true);
  if (unknown.ok) {
    assert.ok(unknown.exceptions.some(item => item.code === 'panel_type_review'));
    assert.ok(unknown.exceptions.some(item => item.code === 'condition_review'));
    assert.equal(unknown.value.canSharePhotos, 'yes');
  }

  const needsAddress = validateIntake({ ...fictionalPreviewDraft, pickupAddress: 'San Francisco' });
  assert.equal(needsAddress.ok, false);
  if (!needsAddress.ok) assert.ok(needsAddress.errors.some(error => error.field === 'pickupAddress'));

  const past = validateIntake({ ...fictionalPreviewDraft, desiredDate: '2020-01-01' }, '2026-11-08');
  assert.equal(past.ok, false);
  const preference = validateIntake({ ...fictionalPreviewDraft, desiredDate: '2026-12-01' }, '2026-11-08');
  assert.equal(preference.ok, true);
  if (preference.ok) {
    assert.equal(preference.value.desiredDate, '2026-12-01');
    assert.ok(preference.exceptions.some(item => item.code === 'date_preference'));
    assert.equal(preference.draft.logisticsConfirmed, false);
    assert.equal(preference.draft.orderConfirmed, false);
  }
});

test('intact crystalline drop-off does not demand photos or a street address', () => {
  const result = validateIntake({
    ...fictionalPreviewDraft,
    transport: 'dropoff',
    panelType: 'crystalline-silicon',
    condition: 'intact',
    packaging: 'palletized',
    canSharePhotos: '',
    loading: '',
    pickupAddress: 'should not be required',
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.canSharePhotos, null);
  assert.equal(result.value.pickupAddress, null);
  assert.equal(result.value.loading, null);
});

test('front-end clicks cannot confirm commercial states', () => {
  for (const action of FRONTEND_COMMERCIAL_ACTIONS) {
    const result = frontendTransition(action);
    assert.equal(result.ok, false);
    assert.equal(result.submitted, false);
    assert.equal(result.caseCreated, false);
    assert.equal(result.stage, 'draft_pending_review');
  }
});

test('preview events stay in memory and commercial events are refused', () => {
  resetPreviewEvents();
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = (() => {
    called = true;
    throw new Error('network should not be used');
  }) as typeof fetch;
  try {
    const intent = recordPreviewEvent({ name: 'intent_selected', intent: 'service', campaign: 'replus' });
    const started = recordPreviewEvent({ name: 'intake_started' });
    const validated = recordPreviewEvent({ name: 'intake_validated', exceptionCount: 2 });
    const scenario = recordPreviewEvent({ name: 'scenario_valid', configuration: 'not-sure' });
    const evidence = recordPreviewEvent({ name: 'evidence_viewed', sourceId: 'recovery' });
    const technical = recordPreviewEvent({ name: 'technical_request' });
    const quote = recordPreviewEvent({ name: 'quote_approved' });
    const order = recordPreviewEvent({ name: 'order_placed' });
    assert.equal(intent.delivered, false);
    assert.equal(intent.accepted, true);
    assert.equal(started.reason, 'preview_noop');
    assert.equal(validated.accepted, true);
    assert.equal(scenario.accepted, true);
    assert.equal(evidence.accepted, true);
    assert.equal(technical.accepted, true);
    assert.equal(quote.accepted, false);
    assert.equal(quote.reason, 'commercial_state_requires_trusted_backend');
    assert.equal(order.delivered, false);
    assert.equal(called, false);
    assert.equal(previewEventLog().length, 6);
    assert.equal(JSON.stringify(previewEventLog()).includes('@'), false);
  } finally {
    globalThis.fetch = originalFetch;
    resetPreviewEvents();
  }
});

test('journey links keep campaign context and drop personal data', () => {
  const ctx = readJourneyContext('?intent=equipment&utm_campaign=replus_hall&utm_source=qr&email=person@company.com&company=Secret%20Co&name=Ada&zip=92584&utm_content=we%20met');
  assert.equal(ctx.intent, 'equipment');
  assert.equal(ctx.utm_campaign, 'replus_hall');
  assert.equal(ctx.utm_source, 'qr');
  assert.equal(ctx.utm_content, '');
  assert.equal(JSON.stringify(ctx).includes('person@'), false);
  assert.equal(JSON.stringify(ctx).includes('Secret'), false);
  assert.equal(JSON.stringify(ctx).includes('Ada'), false);
  assert.equal(JSON.stringify(ctx).includes('92584'), false);
  const href = buildJourneyHref('/equipment/pv-circulator#business-case', ctx);
  assert.equal(href.includes('email'), false);
  assert.match(href, /^\/equipment\/pv-circulator\?/);
  assert.match(href, /intent=equipment/);
  assert.match(href, /utm_campaign=replus_hall/);
  assert.match(href, /#business-case$/);
  const external = businessCaseHref({ ...ctx, utm_source: 'person@company.com' });
  assert.equal(external.startsWith('https://businesscase.pvcirconomy.com/'), true);
  assert.equal(external.includes('person@'), false);
  assert.equal(external.includes('email='), false);
  assert.match(external, /intent=equipment/);
  assert.match(external, /utm_source=pvcirconomy_preview/);
  assert.equal(publicPath('/services/solar-panel-recycling'), '/PVCirconomy/services/solar-panel-recycling/');
  assert.equal(publicPath('/'), '/PVCirconomy/');
});

test('evidence does not promote unpublished claims to verified results', () => {
  assert.ok(evidenceIndex.length >= 8);
  for (const item of evidenceIndex) {
    assert.equal(item.independentlyVerified, false);
    assert.equal(item.testDate, null);
  }
  const recovery = evidenceIndex.find(item => item.id === 'recovery');
  assert.equal(recovery?.nominalOrMeasured, 'nominal published figure');
  assert.match(recovery?.missing ?? '', /purity/i);
  const certificates = evidenceIndex.find(item => item.id === 'ce-sgs');
  assert.equal(certificates?.kind, 'not-approved');
  assert.match(certificates?.publicStatement ?? '', /does not contain an approved public source/i);
  const jb = evidenceIndex.find(item => item.id === 'jb-tool');
  assert.match(jb?.publicStatement ?? '', /pending review/i);
  const capacity = evidenceIndex.find(item => item.id === 'capacity');
  assert.match(capacity?.publicStatement ?? '', /storage quantity would not be the same/i);
  assert.ok(approvalChecklist.some(item => /JB Tool/.test(item)));
  assert.ok(approvalChecklist.some(item => /RE\+/.test(item)));
});

test('scenario and technical request cannot become a commercial case', () => {
  const denied = reviewScenario({ configuration: 'premium', acknowledged: false });
  assert.equal(denied.ok, false);
  const reviewed = reviewScenario({ configuration: 'premium', acknowledged: true });
  assert.equal(reviewed.ok, true);
  if (reviewed.ok) assert.equal(reviewed.commercialCase, false);
  const technical = validateTechnicalRequest({
    organization: 'Example Recovery LLC',
    contactName: 'Preview Person',
    workEmail: 'preview.person@example.com',
    state: 'Texas',
    role: 'new-us-entrant',
    note: 'Public feedstock description only.',
    inquiryConsent: true,
    marketingOptIn: false,
    allowPersonalEmail: false,
  });
  assert.equal(technical.ok, true);
  if (technical.ok) assert.equal(technical.marketingOptIn, false);
});

test('pages and workflows cannot treat this branch as production', () => {
  for (const route of journeyRoutes) {
    assert.equal(readFileSync(route.file, 'utf8').length > 0, true);
  }
  const pages = readFileSync('.github/workflows/pages.yml', 'utf8');
  assert.match(pages, /branches:\s*\[main\]/);
  assert.doesNotMatch(pages, /pull_request/);
  assert.match(pages, /actions\/deploy-pages@/);
  const preview = readFileSync('.github/workflows/preview-check.yml', 'utf8');
  assert.match(preview, /pull_request/);
  assert.doesNotMatch(preview, /deploy-pages|actions\/deploy/);
  const sources = [
    'app/components/service-intake.tsx',
    'app/components/equipment-tools.tsx',
    'lib/journey/events.ts',
    'lib/journey/intake.ts',
  ];
  for (const file of sources) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /fetch\(|mailto:|localStorage|gtag|apollo|sendBeacon|XMLHttpRequest/i);
  }
});
