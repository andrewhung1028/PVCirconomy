import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  PAYBACK_NEEDS_INVESTMENT,
  PAYBACK_NONE,
  QUOTED_AFTER_REVIEW,
  applyRatio,
  calculateScenario,
  createTestOrder,
  demoScenario,
  demoService,
  emptySession,
  estimateService,
  liveSnapshot,
} from './model';

test('demo scenario calculates and keeps labor independent of utilization', () => {
  const demo = demoScenario();
  const full = calculateScenario(demo);
  const slow = calculateScenario({ ...demo, utilizationPct: 0 });
  assert.equal(full.ok, true);
  assert.equal(slow.ok, true);
  if (!full.ok || !slow.ok) return;
  assert.equal(full.result.paidLaborHours, slow.result.paidLaborHours);
  assert.ok((full.result.panelsPerMonth) > 0);
  assert.equal(slow.result.panelsPerMonth, 0);
  assert.equal(slow.result.paybackMessage, PAYBACK_NONE);
  assert.equal(slow.result.paybackMonths, null);
  assert.ok((full.result.paybackMonths ?? 0) > 0);
  assert.equal(full.result.costs.some(cost => cost.code === 'initialFreight'), false);
  assert.ok((full.result.investment ?? 0) > (demo.capex ?? 0));
});

test('throughput bounds, monthly alternative, mass share, ratio, direct price, and residue', () => {
  const demo = demoScenario();
  assert.equal(calculateScenario({ ...demo, hoursPerDay: 0 }).ok, false);
  assert.equal(calculateScenario({ ...demo, hoursPerDay: 24 }).ok, true);
  assert.equal(calculateScenario({ ...demo, hoursPerDay: 25 }).ok, false);
  assert.equal(calculateScenario({ ...demo, daysPerMonth: 0 }).ok, false);
  assert.equal(calculateScenario({ ...demo, daysPerMonth: 1 }).ok, true);
  assert.equal(calculateScenario({ ...demo, daysPerMonth: 31 }).ok, true);
  assert.equal(calculateScenario({ ...demo, daysPerMonth: 32 }).ok, false);
  assert.equal(calculateScenario({ ...demo, utilizationPct: -1 }).ok, false);
  assert.equal(calculateScenario({ ...demo, utilizationPct: 100 }).ok, true);
  const monthly = calculateScenario({ ...demo, throughputMode: 'monthly', panelsPerMonth: 1000, hoursPerDay: null, daysPerMonth: 22, utilizationPct: null, panelsPerHour: null });
  assert.equal(monthly.ok, true);
  if (monthly.ok) assert.equal(monthly.result.panelsPerMonth, 1000);
  const overweight = calculateScenario({ ...demo, materials: demo.materials.map(material => ({ ...material, massSharePct: 30 })) });
  assert.equal(overweight.ok, false);
  const low = calculateScenario(applyRatio(demo, 30));
  const high = calculateScenario(applyRatio(demo, 100));
  assert.equal(low.ok && high.ok, true);
  if (!low.ok || !high.ok) return;
  const glassLow = low.result.materials.find(material => material.code === 'GLASS');
  const glassHigh = high.result.materials.find(material => material.code === 'GLASS');
  const aluminumLow = low.result.materials.find(material => material.code === 'ALUMINUM');
  const aluminumHigh = high.result.materials.find(material => material.code === 'ALUMINUM');
  assert.equal(glassLow?.revenue, glassHigh?.revenue);
  assert.ok((aluminumHigh?.revenue ?? 0) > (aluminumLow?.revenue ?? 0));
  assert.equal(low.result.intakeFeeRevenue, high.result.intakeFeeRevenue);
  const base = calculateScenario(demo);
  if (!base.ok) return;
  const expectedSold = base.result.inputTonnes * 0.7 * 0.8 * 1;
  assert.ok(Math.abs((glassLow?.soldTonnes ?? 0) - expectedSold) < 1e-9);
  const customResidue = calculateScenario({ ...demo, residueOverrideTonnes: 3 });
  if (customResidue.ok) {
    assert.equal(customResidue.result.residueTonnes, 3);
    assert.notEqual(customResidue.result.residueTonnes, base.result.residueTonnes);
  }
  const missingCapex = calculateScenario({ ...demo, capex: null });
  assert.equal(missingCapex.ok, true);
  if (missingCapex.ok) assert.equal(missingCapex.result.paybackMessage, PAYBACK_NEEDS_INVESTMENT);
});

test('service estimate never prices unknown items as zero and does not multiply count by a tonne rate', () => {
  const priced = estimateService(demoService());
  assert.equal(priced.ok, true);
  if (!priced.ok) return;
  assert.equal(priced.estimate.knownTotal, 320);
  assert.equal(priced.estimate.falselyAccepted, false);
  assert.ok(priced.estimate.quoted.every(item => item.detail !== '$0' && !/included|free/i.test(item.detail)));
  assert.equal(JSON.stringify(priced.estimate.quoted).includes('"$0"'), false);
  assert.equal(priced.estimate.quoted.some(item => item.detail === QUOTED_AFTER_REVIEW), true);
  const byTonne = estimateService({ ...demoService(), handlingUnit: 'per-tonne', handlingRate: '100' });
  assert.equal(byTonne.ok, true);
  if (!byTonne.ok) return;
  assert.equal(byTonne.estimate.knownTotal, null);
  assert.equal(byTonne.estimate.known.length, 0);
  assert.equal(byTonne.estimate.estimatedWeightKg, 40 * 22);
  const weight = estimateService({ ...demoService(), quantityMode: 'weight', count: '', weight: '2', weightUnit: 'tonne', handlingUnit: 'per-tonne', handlingRate: '50' });
  assert.equal(weight.ok, true);
  if (weight.ok) assert.equal(weight.estimate.knownTotal, 100);
  const thin = estimateService({ ...demoService(), panelType: 'thin-film', condition: 'unknown' });
  assert.equal(thin.ok, true);
  if (thin.ok) assert.equal(thin.estimate.acceptance, 'pending-review');
});

test('scenario snapshot stays in sync and test orders need both acknowledgements', () => {
  const session = emptySession();
  session.equipment = { ...session.equipment, product: 'pv-circulator', requirements: 'Separate frames and glass.', organization: 'Example Recovery LLC', contactName: 'Preview Person', workEmail: 'preview.person@example.com', state: 'CA', configuration: 'unspecified', siteType: 'warehouse', timing: 'one-off' };
  session.equipmentStatus = 'configured';
  session.scenario = demoScenario();
  session.attachScenario = true;
  const denied = createTestOrder(session, { now: '2026-11-08T00:00:00Z', id: '1001', estimatesNotFinal: false, testOnly: false });
  assert.equal(denied.ok, false);
  const created = createTestOrder(session, { now: '2026-11-08T00:00:00Z', id: '1001', estimatesNotFinal: true, testOnly: true });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.order.reference, 'TEST-EQ-1001');
  assert.equal(created.order.sent, false);
  assert.equal(created.order.paymentTaken, false);
  const before = created.order.equipment?.snapshot?.result.intakeFeeRevenue;
  session.scenario = { ...session.scenario, intakeFeePerPanel: 12 };
  const refreshed = liveSnapshot(session, '2026-11-08T01:00:00Z');
  assert.ok(refreshed);
  assert.notEqual(refreshed?.result.intakeFeeRevenue, before);
  const serviceSession = emptySession();
  serviceSession.service = demoService();
  serviceSession.serviceStatus = 'estimated';
  const serviceOrder = createTestOrder(serviceSession, { now: '2026-11-08T00:00:00Z', id: '2002', estimatesNotFinal: true, testOnly: true });
  assert.equal(serviceOrder.ok, true);
  if (serviceOrder.ok) {
    assert.equal(serviceOrder.order.reference.startsWith('TEST-SVC-'), true);
    assert.equal(serviceOrder.order.service?.estimate.knownTotal, 320);
    assert.notEqual(serviceOrder.order.service?.estimate.knownTotal, refreshed?.result.intakeFeeRevenue);
  }
  const jb = emptySession();
  jb.equipment = { ...emptySession().equipment, product: 'jb-tool', requirements: 'Ask for a quote only.', organization: 'Example Recovery LLC', contactName: 'Preview Person', workEmail: 'preview.person@example.com', state: 'CA', jbDailyPanels: '200', jbMinutesSaved: '1', jbHourlyWage: '30' };
  jb.equipmentStatus = 'configured';
  const jbOrder = createTestOrder(jb, { now: '2026-11-08T00:00:00Z', id: '3003', estimatesNotFinal: true, testOnly: true });
  assert.equal(jbOrder.ok, true);
  if (jbOrder.ok) {
    assert.equal(jbOrder.order.reference, 'TEST-EQ-3003');
    assert.equal(jbOrder.order.equipment?.hypothetical?.amount, 100);
    assert.equal(jbOrder.order.equipment?.hypothetical?.performanceClaim, false);
    assert.equal(jbOrder.order.equipment?.quoted.some(item => 'amount' in item), false);
  }
});

test('commerce screens do not send payment or enroll contacts', () => {
  for (const file of ['lib/commerce/model.ts', 'app/components/service-flow.tsx', 'app/components/equipment-flow.tsx', 'app/components/scenario-model.tsx', 'app/components/order-desk.tsx']) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /fetch\(|mailto:|apollo|sendBeacon|cardnumber|localStorage/i);
  }
});
