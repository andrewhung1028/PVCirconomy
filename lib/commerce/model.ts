import { normalizeState, zipPrefixState } from '../journey/intake';

export const MODEL_VERSION = 'scenario-2026-11-08';
export const QUOTED_AFTER_REVIEW = 'Quoted after review';
export const PAYBACK_NONE = 'No positive simple payback under these assumptions';
export const PAYBACK_NEEDS_INVESTMENT = 'Add investment assumptions to calculate payback';
export const NOT_A_MARKET_QUOTE = 'Illustrative assumption — not a market quotation';

export type PanelType = 'crystalline-silicon' | 'bifacial' | 'thin-film' | 'mixed' | 'unknown';
export type PanelCondition = 'intact' | 'damaged' | 'mixed' | 'unknown';
export type Packaging = 'palletized' | 'crated' | 'loose' | 'mixed' | 'unknown';
export type SiteType = 'ground' | 'roof' | 'warehouse' | 'other';
export type Timing = 'one-off' | 'recurring';
export type LogisticsChoice = 'pickup-assessment' | 'own-carrier' | 'delivery-pending';
export type HandlingUnit = 'per-panel' | 'per-kg' | 'per-tonne';
export type EquipmentProduct = 'pv-circulator' | 'jb-tool';
export type ConfigurationRequest = 'economic' | 'basic' | 'premium' | 'unspecified';
export type FlowStatus = 'draft' | 'estimated' | 'configured' | 'reviewed' | 'test_created';

export type ServiceDraft = {
  panelType: PanelType | '';
  condition: PanelCondition | '';
  quantityMode: 'count' | 'weight' | '';
  count: string;
  weight: string;
  weightUnit: 'kg' | 'tonne' | '';
  estimatedKgPerPanel: string;
  packaging: Packaging | '';
  state: string;
  zip: string;
  siteType: SiteType | '';
  timing: Timing | '';
  targetDate: string;
  logistics: LogisticsChoice | '';
  handlingRate: string;
  handlingUnit: HandlingUnit;
  organization: string;
  contactName: string;
  workEmail: string;
  phone: string;
};

export type KnownCharge = { label: string; amount: number; currency: 'USD'; detail: string };
export type QuoteItem = { label: string; detail: string };

export type ServiceEstimate = {
  status: 'estimated';
  acceptance: 'pending-review';
  falselyAccepted: false;
  known: KnownCharge[];
  quoted: QuoteItem[];
  estimatedWeightKg: number | null;
  knownTotal: number | null;
  currency: 'USD';
};

export type MaterialInput = {
  code: string;
  name: string;
  massSharePct: number;
  yieldPct: number;
  saleablePct: number;
  priceMode: 'benchmark' | 'direct';
  benchmarkPrice: number | null;
  directPrice: number | null;
  source: string;
  sourceDate: string;
};

export type ScenarioInput = {
  currency: string;
  throughputMode: 'rate' | 'monthly';
  panelsPerHour: number | null;
  hoursPerDay: number | null;
  daysPerMonth: number | null;
  utilizationPct: number | null;
  panelsPerMonth: number | null;
  kgPerPanel: number | null;
  intakeFeePerPanel: number | null;
  headcount: number | null;
  paidHoursPerPersonPerDay: number | null;
  laborWagePerHour: number | null;
  laborBurdenPct: number | null;
  kwhPerPanel: number | null;
  electricityPricePerKwh: number | null;
  consumablesPerPanel: number | null;
  maintenancePerMonth: number | null;
  rentPerMonth: number | null;
  inboundFreightPerTonne: number | null;
  outboundFreightPerTonne: number | null;
  residueDisposalPerTonne: number | null;
  residueOverrideTonnes: number | null;
  capex: number | null;
  installation: number | null;
  initialFreight: number | null;
  otherStartup: number | null;
  virginRatioPct: number;
  materials: MaterialInput[];
};

export type MaterialResult = {
  code: string;
  name: string;
  soldTonnes: number;
  pricePerTonne: number | null;
  revenue: number | null;
  priceMode: 'benchmark' | 'direct';
};

export type CostLine = { code: string; label: string; amount: number | null; basis: string };

export type ScenarioResult = {
  panelsPerMonth: number;
  paidLaborHours: number | null;
  inputTonnes: number;
  materials: MaterialResult[];
  unassignedMassSharePct: number;
  soldTonnes: number;
  residueTonnes: number;
  residueOverridden: boolean;
  intakeFeeRevenue: number | null;
  materialRevenue: number;
  pricedMaterialCount: number;
  costs: CostLine[];
  costsKnown: number;
  missing: string[];
  monthlySurplus: number | null;
  investment: number | null;
  investmentMissing: string[];
  paybackMonths: number | null;
  paybackMessage: string | null;
  currency: string;
};

export type FieldError = { field: string; message: string };

export type EquipmentDraft = {
  product: EquipmentProduct | '';
  configuration: ConfigurationRequest | '';
  requirements: string;
  desiredPanelsPerDay: string;
  desiredElectricity: string;
  desiredAir: string;
  state: string;
  zip: string;
  siteType: SiteType | '';
  timing: Timing | '';
  targetDate: string;
  organization: string;
  contactName: string;
  workEmail: string;
  phone: string;
  jbDailyPanels: string;
  jbMinutesSaved: string;
  jbHourlyWage: string;
};

export type ScenarioSnapshot = {
  modelVersion: typeof MODEL_VERSION;
  capturedAt: string;
  product: EquipmentProduct;
  inputs: ScenarioInput;
  result: ScenarioResult;
  capexIsOffer: false;
};

export type HypotheticalLabor = {
  label: string;
  amount: number;
  currency: string;
  hypothetical: true;
  performanceClaim: false;
};

export type ReviewSession = {
  service: ServiceDraft;
  equipment: EquipmentDraft;
  scenario: ScenarioInput;
  attachScenario: boolean;
  serviceStatus: FlowStatus;
  equipmentStatus: FlowStatus;
  order: TestOrder | null;
};

export type TestOrder = {
  reference: string;
  kind: 'TEST-SVC' | 'TEST-EQ';
  status: 'test_created';
  createdAt: string;
  sent: false;
  paymentTaken: false;
  fulfillmentArranged: false;
  service: { draft: ServiceDraft; estimate: ServiceEstimate } | null;
  equipment: { draft: EquipmentDraft; quoted: QuoteItem[]; snapshot: ScenarioSnapshot | null; hypothetical: HypotheticalLabor | null } | null;
  estimatesNotFinal: true;
  testOnly: true;
};

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function emptyService(): ServiceDraft {
  return {
    panelType: '', condition: '', quantityMode: '', count: '', weight: '', weightUnit: '',
    estimatedKgPerPanel: '22', packaging: '', state: 'CA', zip: '', siteType: '', timing: '',
    targetDate: '', logistics: '', handlingRate: '', handlingUnit: 'per-panel',
    organization: '', contactName: '', workEmail: '', phone: '',
  };
}

export function demoService(): ServiceDraft {
  return {
    panelType: 'crystalline-silicon',
    condition: 'intact',
    quantityMode: 'count',
    count: '40',
    weight: '',
    weightUnit: '',
    estimatedKgPerPanel: '22',
    packaging: 'palletized',
    state: 'CA',
    zip: '94105',
    siteType: 'ground',
    timing: 'one-off',
    targetDate: '',
    logistics: 'pickup-assessment',
    handlingRate: '8',
    handlingUnit: 'per-panel',
    organization: 'North Example Solar',
    contactName: 'Preview Person',
    workEmail: 'preview.person@example.com',
    phone: '415-555-0100',
  };
}

export function blankMaterial(code: string, name: string, share = 0): MaterialInput {
  return {
    code, name, massSharePct: share, yieldPct: 80, saleablePct: 100,
    priceMode: code === 'GLASS' || code === 'POLYMER' ? 'direct' : 'benchmark',
    benchmarkPrice: null, directPrice: null, source: '', sourceDate: '',
  };
}

export function emptyScenario(): ScenarioInput {
  return {
    currency: 'USD',
    throughputMode: 'rate',
    panelsPerHour: null,
    hoursPerDay: null,
    daysPerMonth: null,
    utilizationPct: null,
    panelsPerMonth: null,
    kgPerPanel: null,
    intakeFeePerPanel: null,
    headcount: null,
    paidHoursPerPersonPerDay: null,
    laborWagePerHour: null,
    laborBurdenPct: null,
    kwhPerPanel: null,
    electricityPricePerKwh: null,
    consumablesPerPanel: null,
    maintenancePerMonth: null,
    rentPerMonth: null,
    inboundFreightPerTonne: null,
    outboundFreightPerTonne: null,
    residueDisposalPerTonne: null,
    residueOverrideTonnes: null,
    capex: null,
    installation: null,
    initialFreight: null,
    otherStartup: null,
    virginRatioPct: 50,
    materials: [
      blankMaterial('GLASS', 'Glass', 0),
      blankMaterial('ALUMINUM', 'Aluminum', 0),
      blankMaterial('COPPER', 'Copper', 0),
      blankMaterial('CELL', 'Cell material', 0),
      blankMaterial('POLYMER', 'Polymers', 0),
    ],
  };
}

export function demoScenario(): ScenarioInput {
  const base = emptyScenario();
  return {
    ...base,
    throughputMode: 'rate',
    panelsPerHour: 40,
    hoursPerDay: 8,
    daysPerMonth: 22,
    utilizationPct: 70,
    kgPerPanel: 22,
    intakeFeePerPanel: 6,
    headcount: 3,
    paidHoursPerPersonPerDay: 8,
    laborWagePerHour: 25,
    laborBurdenPct: 15,
    kwhPerPanel: 1,
    electricityPricePerKwh: 0.15,
    consumablesPerPanel: 0.5,
    maintenancePerMonth: 2000,
    rentPerMonth: 4000,
    inboundFreightPerTonne: 20,
    outboundFreightPerTonne: 25,
    residueDisposalPerTonne: 40,
    residueOverrideTonnes: null,
    capex: 800000,
    installation: 50000,
    initialFreight: 20000,
    otherStartup: 10000,
    virginRatioPct: 50,
    materials: [
      { ...blankMaterial('GLASS', 'Glass', 70), priceMode: 'direct', directPrice: 30, source: NOT_A_MARKET_QUOTE },
      { ...blankMaterial('ALUMINUM', 'Aluminum', 10), priceMode: 'benchmark', benchmarkPrice: 2000, yieldPct: 90, saleablePct: 80, source: NOT_A_MARKET_QUOTE },
      { ...blankMaterial('COPPER', 'Copper', 1), priceMode: 'benchmark', benchmarkPrice: 8000, yieldPct: 80, saleablePct: 50, source: NOT_A_MARKET_QUOTE },
      { ...blankMaterial('CELL', 'Cell material', 3), priceMode: 'benchmark', benchmarkPrice: 1000, yieldPct: 70, saleablePct: 50, source: NOT_A_MARKET_QUOTE },
      { ...blankMaterial('POLYMER', 'Polymers', 6), priceMode: 'direct', directPrice: 10, yieldPct: 80, source: NOT_A_MARKET_QUOTE },
    ],
  };
}

export function emptyEquipment(product: EquipmentProduct | '' = ''): EquipmentDraft {
  return {
    product, configuration: '', requirements: '', desiredPanelsPerDay: '', desiredElectricity: '',
    desiredAir: '', state: 'CA', zip: '', siteType: '', timing: '', targetDate: '',
    organization: '', contactName: '', workEmail: '', phone: '',
    jbDailyPanels: '', jbMinutesSaved: '', jbHourlyWage: '',
  };
}

export function emptySession(): ReviewSession {
  return {
    service: emptyService(),
    equipment: emptyEquipment(),
    scenario: emptyScenario(),
    attachScenario: false,
    serviceStatus: 'draft',
    equipmentStatus: 'draft',
    order: null,
  };
}

function num(value: string): number | null {
  const text = value.trim();
  if (!text) return null;
  if (!/^\d+(\.\d+)?$/.test(text)) return Number.NaN;
  return Number(text);
}

function push(errors: FieldError[], field: string, message: string) {
  errors.push({ field, message });
}

export function estimateService(draft: ServiceDraft): { ok: true; estimate: ServiceEstimate } | { ok: false; errors: FieldError[] } {
  const errors: FieldError[] = [];
  if (!draft.panelType) push(errors, 'panelType', 'Choose a panel type. Unknown is allowed.');
  if (!draft.condition) push(errors, 'condition', 'Choose a condition. Unknown is allowed.');
  if (draft.quantityMode !== 'count' && draft.quantityMode !== 'weight') push(errors, 'quantityMode', 'Enter a panel count or a weight.');
  const count = num(draft.count);
  const weight = num(draft.weight);
  const kgEach = num(draft.estimatedKgPerPanel);
  if (draft.quantityMode === 'count') {
    if (count === null || Number.isNaN(count) || !Number.isInteger(count) || count < 1) push(errors, 'count', 'Enter a whole panel count of at least 1.');
  }
  if (draft.quantityMode === 'weight') {
    if (weight === null || Number.isNaN(weight) || weight <= 0) push(errors, 'weight', 'Enter a weight above zero.');
    if (draft.weightUnit !== 'kg' && draft.weightUnit !== 'tonne') push(errors, 'weightUnit', 'Choose kilograms or tonnes.');
  }
  if (draft.quantityMode === 'count' && (kgEach === null || Number.isNaN(kgEach) || kgEach <= 0)) {
    push(errors, 'estimatedKgPerPanel', 'Enter the estimated kilograms per panel used only to show weight.');
  }
  if (!draft.packaging) push(errors, 'packaging', 'Choose packaging, including Unknown.');
  const state = normalizeState(draft.state);
  if (!state) push(errors, 'state', 'Choose a U.S. state.');
  const zipState = zipPrefixState(draft.zip);
  if (zipState === 'invalid') push(errors, 'zip', 'Enter a 5-digit ZIP code.');
  else if (state && zipState !== 'unassigned' && zipState !== state) push(errors, 'zip', 'This ZIP prefix does not match the selected state.');
  if (!draft.siteType) push(errors, 'siteType', 'Choose the site type.');
  if (draft.timing !== 'one-off' && draft.timing !== 'recurring') push(errors, 'timing', 'Choose one-off or recurring.');
  if (draft.targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(draft.targetDate)) push(errors, 'targetDate', 'Use a real date or leave timing open.');
  if (!draft.logistics) push(errors, 'logistics', 'Choose pickup assessment, your own carrier, or delivery pending confirmation.');
  const rate = num(draft.handlingRate);
  if (draft.handlingRate.trim() && (rate === null || Number.isNaN(rate) || rate <= 0)) {
    push(errors, 'handlingRate', 'Enter an example handling rate above zero, or leave it blank so handling stays quoted after review.');
  }
  if (errors.length) return { ok: false, errors };

  const known: KnownCharge[] = [];
  const quoted: QuoteItem[] = [
    { label: 'Transport', detail: QUOTED_AFTER_REVIEW },
    { label: 'Packaging charges', detail: QUOTED_AFTER_REVIEW },
    { label: 'Taxes', detail: QUOTED_AFTER_REVIEW },
    { label: 'Documents', detail: QUOTED_AFTER_REVIEW },
  ];
  if (draft.logistics === 'delivery-pending') {
    quoted.unshift({ label: 'Delivery destination', detail: 'Pending confirmation. No receiving site is reserved.' });
  }

  let estimatedWeightKg: number | null = null;
  if (draft.quantityMode === 'count' && count !== null && kgEach !== null) estimatedWeightKg = count * kgEach;
  if (draft.quantityMode === 'weight' && weight !== null) estimatedWeightKg = draft.weightUnit === 'tonne' ? weight * 1000 : weight;

  if (rate === null) {
    quoted.unshift({ label: 'Handling', detail: QUOTED_AFTER_REVIEW });
  } else if (draft.quantityMode === 'count' && draft.handlingUnit === 'per-panel' && count !== null) {
    known.push({ label: 'Handling', amount: count * rate, currency: 'USD', detail: `${count} panels × $${rate} per panel. Example rate, not a price list.` });
  } else if (draft.quantityMode === 'weight' && weight !== null && (draft.handlingUnit === 'per-kg' || draft.handlingUnit === 'per-tonne')) {
    const qty = draft.handlingUnit === 'per-tonne' ? weight / (draft.weightUnit === 'tonne' ? 1 : 1000) : weight * (draft.weightUnit === 'kg' ? 1 : 1000);
    const unitLabel = draft.handlingUnit === 'per-tonne' ? 'per tonne' : 'per kg';
    known.push({ label: 'Handling', amount: qty * rate, currency: 'USD', detail: `${qty} × $${rate} ${unitLabel}. Weight is not converted from a panel count.` });
  } else {
    quoted.unshift({ label: 'Handling', detail: 'Not calculated. A panel count is not multiplied by a per-tonne or per-kg rate, and a weight is not turned into a panel count.' });
  }

  const needsReview = draft.panelType === 'thin-film' || draft.panelType === 'unknown' || draft.panelType === 'mixed'
    || draft.condition === 'unknown' || draft.condition === 'damaged' || draft.condition === 'mixed'
    || state !== 'CA';
  if (needsReview) {
    quoted.push({ label: 'Acceptance', detail: 'Not accepted on this page. Thin-film, mixed, unknown, damaged loads, and locations outside California can still be submitted for review.' });
  }

  return {
    ok: true,
    estimate: {
      status: 'estimated',
      acceptance: 'pending-review',
      falselyAccepted: false,
      known,
      quoted,
      estimatedWeightKg,
      knownTotal: known.length ? known.reduce((sum, line) => sum + line.amount, 0) : null,
      currency: 'USD',
    },
  };
}

function finite(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

export function applyRatio(input: ScenarioInput, ratio: 30 | 50 | 70 | 100): ScenarioInput {
  return { ...input, virginRatioPct: ratio, materials: input.materials.map(material => ({ ...material })) };
}

export function calculateScenario(input: ScenarioInput): { ok: true; result: ScenarioResult } | { ok: false; errors: FieldError[] } {
  const errors: FieldError[] = [];
  if (!/^[A-Z]{3}$/.test(input.currency)) push(errors, 'currency', 'Choose a 3-letter currency. Amounts are entered in that currency and are not converted.');
  if (input.virginRatioPct < 30 || input.virginRatioPct > 100) push(errors, 'virginRatioPct', 'Recovered-material selling price must be from 30% to 100% of the reference benchmark.');
  let panelsPerMonth = 0;
  if (input.throughputMode === 'rate') {
    if (!finite(input.panelsPerHour) || input.panelsPerHour < 0) push(errors, 'panelsPerHour', 'Enter panels per hour as zero or more.');
    if (!finite(input.hoursPerDay) || input.hoursPerDay <= 0 || input.hoursPerDay > 24) push(errors, 'hoursPerDay', 'Enter hours per day greater than 0 and at most 24.');
    if (!finite(input.daysPerMonth) || input.daysPerMonth < 1 || input.daysPerMonth > 31) push(errors, 'daysPerMonth', 'Enter operating days per month from 1 to 31.');
    if (!finite(input.utilizationPct) || input.utilizationPct < 0 || input.utilizationPct > 100) push(errors, 'utilizationPct', 'Enter utilization from 0% to 100%.');
    if (!errors.some(error => ['panelsPerHour', 'hoursPerDay', 'daysPerMonth', 'utilizationPct'].includes(error.field))) {
      panelsPerMonth = (input.panelsPerHour as number) * (input.hoursPerDay as number) * (input.daysPerMonth as number) * ((input.utilizationPct as number) / 100);
    }
  } else {
    if (!finite(input.panelsPerMonth) || input.panelsPerMonth < 0) push(errors, 'panelsPerMonth', 'Enter panels per month as zero or more.');
    else panelsPerMonth = input.panelsPerMonth;
  }
  if (!finite(input.kgPerPanel) || input.kgPerPanel <= 0) push(errors, 'kgPerPanel', 'Enter kilograms per panel above zero.');
  const share = input.materials.reduce((sum, material) => sum + material.massSharePct, 0);
  if (share > 100 + 1e-9) push(errors, 'massShare', 'Mass shares cannot add up to more than 100%.');
  input.materials.forEach(material => {
    if (material.massSharePct < 0 || material.yieldPct < 0 || material.yieldPct > 100 || material.saleablePct < 0 || material.saleablePct > 100) {
      push(errors, material.code, `${material.name} needs a non-negative mass share, and yield and saleable fraction from 0% to 100%.`);
    }
  });
  if (finite(input.residueOverrideTonnes) && input.residueOverrideTonnes < 0) push(errors, 'residueOverrideTonnes', 'Residue override cannot be negative.');
  if (errors.length) return { ok: false, errors };

  const inputTonnes = panelsPerMonth * (input.kgPerPanel as number) / 1000;
  const materials: MaterialResult[] = input.materials.map(material => {
    const soldTonnes = inputTonnes * (material.massSharePct / 100) * (material.yieldPct / 100) * (material.saleablePct / 100);
    const pricePerTonne = material.priceMode === 'direct'
      ? material.directPrice
      : material.benchmarkPrice === null ? null : material.benchmarkPrice * (input.virginRatioPct / 100);
    return {
      code: material.code,
      name: material.name,
      soldTonnes,
      pricePerTonne,
      revenue: pricePerTonne === null ? null : soldTonnes * pricePerTonne,
      priceMode: material.priceMode,
    };
  });
  const soldTonnes = materials.reduce((sum, material) => sum + material.soldTonnes, 0);
  const residueOverridden = finite(input.residueOverrideTonnes);
  const residueTonnes = residueOverridden ? (input.residueOverrideTonnes as number) : Math.max(0, inputTonnes - soldTonnes);
  const priced = materials.filter(material => material.revenue !== null);
  const materialRevenue = priced.reduce((sum, material) => sum + (material.revenue as number), 0);
  const intakeFeeRevenue = finite(input.intakeFeePerPanel) ? panelsPerMonth * input.intakeFeePerPanel : null;
  const laborHours = finite(input.headcount) && finite(input.paidHoursPerPersonPerDay) && finite(input.daysPerMonth)
    ? input.headcount * input.paidHoursPerPersonPerDay * input.daysPerMonth
    : null;
  const laborAmount = laborHours !== null && finite(input.laborWagePerHour)
    ? laborHours * input.laborWagePerHour * (1 + (finite(input.laborBurdenPct) ? input.laborBurdenPct : 0) / 100)
    : null;

  const costs: CostLine[] = [
    { code: 'labor', label: 'Labor', amount: laborAmount, basis: 'Paid hours × wage. Not reduced when utilization or throughput falls.' },
    { code: 'electricity', label: 'Electricity', amount: finite(input.kwhPerPanel) && finite(input.electricityPricePerKwh) ? panelsPerMonth * input.kwhPerPanel * input.electricityPricePerKwh : null, basis: 'Processed panels × kWh per panel × price.' },
    { code: 'consumables', label: 'Consumables', amount: finite(input.consumablesPerPanel) ? panelsPerMonth * input.consumablesPerPanel : null, basis: 'Processed panels × cost per panel.' },
    { code: 'maintenance', label: 'Maintenance', amount: input.maintenancePerMonth, basis: 'Monthly amount you enter.' },
    { code: 'rent', label: 'Rent', amount: input.rentPerMonth, basis: 'Monthly amount you enter.' },
    { code: 'inbound', label: 'Inbound freight', amount: finite(input.inboundFreightPerTonne) ? inputTonnes * input.inboundFreightPerTonne : null, basis: 'Input tonnes × rate per tonne. Separate from initial freight.' },
    { code: 'outbound', label: 'Outbound freight', amount: finite(input.outboundFreightPerTonne) ? soldTonnes * input.outboundFreightPerTonne : null, basis: 'Sold tonnes × rate per tonne.' },
    { code: 'residue', label: 'Residue disposal', amount: finite(input.residueDisposalPerTonne) ? residueTonnes * input.residueDisposalPerTonne : null, basis: residueOverridden ? 'Your residue mass override × rate per tonne.' : 'Input tonnes minus sold tonnes × rate per tonne.' },
  ];
  const missing = costs.filter(cost => cost.amount === null).map(cost => cost.label);
  if (intakeFeeRevenue === null) missing.push('Operator intake fee');
  if (priced.length === 0) missing.push('Material selling prices');
  const costsKnown = costs.reduce((sum, cost) => sum + (cost.amount ?? 0), 0);
  const revenueParts = [intakeFeeRevenue, priced.length ? materialRevenue : null].filter((part): part is number => part !== null);
  const monthlySurplus = revenueParts.length === 0 && costsKnown === 0 && missing.length > 0 ? null : revenueParts.reduce((sum, part) => sum + part, 0) - costsKnown;
  const investmentParts: [string, number | null][] = [
    ['Equipment scenario capex', input.capex],
    ['Installation', input.installation],
    ['Initial freight', input.initialFreight],
    ['Other startup', input.otherStartup],
  ];
  const investmentMissing = investmentParts.filter(([, value]) => value === null).map(([label]) => label);
  const investment = finite(input.capex) && input.capex > 0
    ? investmentParts.reduce((sum, [, value]) => sum + (finite(value) ? value : 0), 0)
    : null;
  let paybackMonths: number | null = null;
  let paybackMessage: string | null = null;
  if (!finite(input.capex) || input.capex <= 0) paybackMessage = PAYBACK_NEEDS_INVESTMENT;
  else if (monthlySurplus === null || monthlySurplus <= 0) paybackMessage = PAYBACK_NONE;
  else {
    paybackMonths = investment! / monthlySurplus;
    paybackMessage = null;
  }
  return {
    ok: true,
    result: {
      panelsPerMonth,
      paidLaborHours: laborHours,
      inputTonnes,
      materials,
      unassignedMassSharePct: 100 - share,
      soldTonnes,
      residueTonnes,
      residueOverridden,
      intakeFeeRevenue,
      materialRevenue,
      pricedMaterialCount: priced.length,
      costs,
      costsKnown,
      missing,
      monthlySurplus,
      investment,
      investmentMissing,
      paybackMonths,
      paybackMessage,
      currency: input.currency,
    },
  };
}

export function hypotheticalLabor(draft: EquipmentDraft, currency: string): HypotheticalLabor | null {
  const panels = num(draft.jbDailyPanels);
  const minutes = num(draft.jbMinutesSaved);
  const wage = num(draft.jbHourlyWage);
  if (panels === null || minutes === null || wage === null) return null;
  if ([panels, minutes, wage].some(value => Number.isNaN(value) || value < 0)) return null;
  return {
    label: 'Hypothetical labor illustration',
    amount: panels * (minutes / 60) * wage,
    currency,
    hypothetical: true,
    performanceClaim: false,
  };
}

export const EQUIPMENT_QUOTE_ITEMS: QuoteItem[] = [
  { label: 'Equipment', detail: QUOTED_AFTER_REVIEW },
  { label: 'Installation', detail: QUOTED_AFTER_REVIEW },
  { label: 'Freight', detail: QUOTED_AFTER_REVIEW },
  { label: 'Trade terms', detail: QUOTED_AFTER_REVIEW },
  { label: 'Training', detail: QUOTED_AFTER_REVIEW },
  { label: 'Warranty', detail: QUOTED_AFTER_REVIEW },
  { label: 'Taxes', detail: QUOTED_AFTER_REVIEW },
];

export function captureSnapshot(product: EquipmentProduct, input: ScenarioInput, capturedAt: string): ScenarioSnapshot | null {
  const calculated = calculateScenario(input);
  if (!calculated.ok) return null;
  return { modelVersion: MODEL_VERSION, capturedAt, product, inputs: input, result: calculated.result, capexIsOffer: false };
}

export function refreshSnapshot(snapshot: ScenarioSnapshot, capturedAt: string): ScenarioSnapshot | null {
  return captureSnapshot(snapshot.product, snapshot.inputs, capturedAt);
}

function contactErrors(draft: { organization: string; contactName: string; workEmail: string; state: string }, errors: FieldError[]) {
  if (draft.organization.trim().length < 2) push(errors, 'organization', 'Enter the organization.');
  if (draft.contactName.trim().length < 2) push(errors, 'contactName', 'Enter a contact name.');
  if (!EMAIL.test(draft.workEmail.trim())) push(errors, 'workEmail', 'Enter a work email address.');
  if (!normalizeState(draft.state)) push(errors, 'state', 'Choose a state.');
}

export function createTestOrder(session: ReviewSession, options: { now: string; id: string; estimatesNotFinal: boolean; testOnly: boolean }): { ok: true; order: TestOrder } | { ok: false; errors: FieldError[] } {
  const errors: FieldError[] = [];
  if (!options.estimatesNotFinal) push(errors, 'estimatesNotFinal', 'Confirm these estimates are not a final quote.');
  if (!options.testOnly) push(errors, 'testOnly', 'Confirm this test does not take payment or arrange fulfillment.');
  const serviceOk = session.serviceStatus === 'estimated' || session.serviceStatus === 'reviewed' || session.serviceStatus === 'test_created';
  const equipmentOk = session.equipmentStatus === 'configured' || session.equipmentStatus === 'reviewed' || session.equipmentStatus === 'test_created';
  if (!serviceOk && !equipmentOk) push(errors, 'lines', 'Add a service estimate or an equipment request first.');
  let service: TestOrder['service'] = null;
  let equipment: TestOrder['equipment'] = null;
  if (serviceOk) {
    contactErrors(session.service, errors);
    const estimate = estimateService(session.service);
    if (!estimate.ok) errors.push(...estimate.errors);
    else service = { draft: session.service, estimate: estimate.estimate };
  }
  if (equipmentOk) {
    contactErrors(session.equipment, errors);
    if (!session.equipment.product) push(errors, 'product', 'Choose PV Circulator or JB Tool.');
    if (session.equipment.requirements.trim().length < 3) push(errors, 'requirements', 'Describe the processing requirements you want reviewed.');
    const snapshot = session.attachScenario ? captureSnapshot(session.equipment.product as EquipmentProduct, session.scenario, options.now) : null;
    equipment = {
      draft: session.equipment,
      quoted: EQUIPMENT_QUOTE_ITEMS,
      snapshot,
      hypothetical: session.equipment.product === 'jb-tool' ? hypotheticalLabor(session.equipment, session.scenario.currency || 'USD') : null,
    };
  }
  if (errors.length) return { ok: false, errors };
  const kind = equipment ? 'TEST-EQ' : 'TEST-SVC';
  return {
    ok: true,
    order: {
      reference: `${kind}-${options.id}`,
      kind,
      status: 'test_created',
      createdAt: options.now,
      sent: false,
      paymentTaken: false,
      fulfillmentArranged: false,
      service,
      equipment,
      estimatesNotFinal: true,
      testOnly: true,
    },
  };
}

export function orderSummaryText(order: TestOrder): string {
  const lines = [
    order.reference,
    'Status: test order',
    'This review-mode order has not been sent to our team. No payment, pickup or shipment has been arranged.',
    '',
  ];
  if (order.service) {
    lines.push(`Service organization: ${order.service.draft.organization}`);
    lines.push(`Panels: ${order.service.draft.panelType}, ${order.service.draft.condition}, ${order.service.draft.quantityMode}`);
    lines.push(`Location: ${order.service.draft.state} ${order.service.draft.zip}`);
    lines.push('Estimated known charges:');
    if (!order.service.estimate.known.length) lines.push('- None');
    order.service.estimate.known.forEach(line => lines.push(`- ${line.label}: ${line.amount} ${line.currency}`));
    lines.push('Additional items require a quote:');
    order.service.estimate.quoted.forEach(line => lines.push(`- ${line.label}: ${line.detail}`));
  }
  if (order.equipment) {
    lines.push(`Equipment: ${order.equipment.draft.product}`);
    lines.push('Quoted after review:');
    order.equipment.quoted.forEach(line => lines.push(`- ${line.label}`));
    if (order.equipment.snapshot) {
      const result = calculateScenario(order.equipment.snapshot.inputs);
      lines.push(`Scenario model ${order.equipment.snapshot.modelVersion} captured ${order.equipment.snapshot.capturedAt}`);
      if (result.ok && result.result.monthlySurplus !== null) lines.push(`Monthly operating cash surplus: ${result.result.monthlySurplus} ${result.result.currency}`);
      lines.push('Scenario capex is your assumption, not a TSGC offered price.');
    }
    if (order.equipment.hypothetical) lines.push(`${order.equipment.hypothetical.label}: ${order.equipment.hypothetical.amount} ${order.equipment.hypothetical.currency} (hypothetical, not a performance claim)`);
  }
  return lines.join('\n');
}

export function liveSnapshot(session: ReviewSession, capturedAt: string): ScenarioSnapshot | null {
  if (!session.attachScenario || !session.equipment.product) return null;
  return captureSnapshot(session.equipment.product, session.scenario, capturedAt);
}
