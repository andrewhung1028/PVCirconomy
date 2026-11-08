import { previewReferenceLabel } from './states';

export const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'],
  ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'],
  ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'],
  ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'],
  ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'],
  ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
] as const;

export const ZIP3_RANGES: readonly (readonly [number, number, string])[] = [
  [5, 5, 'NY'], [10, 27, 'MA'], [28, 29, 'RI'], [30, 38, 'NH'], [39, 49, 'ME'], [50, 59, 'VT'],
  [60, 69, 'CT'], [70, 89, 'NJ'], [100, 149, 'NY'], [150, 196, 'PA'], [197, 199, 'DE'],
  [200, 200, 'DC'], [201, 201, 'VA'], [202, 205, 'DC'], [206, 219, 'MD'], [220, 246, 'VA'],
  [247, 268, 'WV'], [270, 289, 'NC'], [290, 299, 'SC'], [300, 319, 'GA'], [320, 349, 'FL'],
  [350, 369, 'AL'], [370, 385, 'TN'], [386, 397, 'MS'], [398, 399, 'GA'], [400, 427, 'KY'],
  [430, 459, 'OH'], [460, 479, 'IN'], [480, 499, 'MI'], [500, 528, 'IA'], [530, 549, 'WI'],
  [550, 567, 'MN'], [570, 577, 'SD'], [580, 588, 'ND'], [590, 599, 'MT'], [600, 629, 'IL'],
  [630, 658, 'MO'], [660, 679, 'KS'], [680, 693, 'NE'], [700, 714, 'LA'], [716, 729, 'AR'],
  [730, 732, 'OK'], [733, 733, 'TX'], [734, 749, 'OK'], [750, 799, 'TX'], [800, 816, 'CO'],
  [820, 831, 'WY'], [832, 838, 'ID'], [840, 847, 'UT'], [850, 865, 'AZ'], [870, 884, 'NM'],
  [885, 885, 'TX'], [889, 898, 'NV'], [900, 961, 'CA'], [967, 968, 'HI'], [970, 979, 'OR'],
  [980, 994, 'WA'], [995, 999, 'AK'],
];

export const PANEL_TYPES = ['crystalline-silicon', 'thin-film', 'bifacial', 'mixed', 'unknown'] as const;
export const CONDITIONS = ['intact', 'damaged', 'mixed', 'unknown'] as const;
export const PACKAGING = ['palletized', 'crated', 'loose', 'mixed', 'unknown'] as const;
export const TRANSPORTS = ['pickup', 'dropoff'] as const;
export const WEIGHT_UNITS = ['lb', 'kg', 'short-ton', 'metric-tonne'] as const;
export const LOADING_OPTIONS = ['forklift', 'dock', 'crane', 'none', 'unknown'] as const;
export const PHOTO_OPTIONS = ['yes', 'no'] as const;
export const TECHNICAL_ROLES = ['existing-recycler', 'waste-operator', 'new-us-entrant', 'other'] as const;
export const SCENARIO_CONFIGS = ['economic', 'basic', 'premium', 'not-sure'] as const;

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'live.com',
  'msn.com', 'me.com', 'proton.me', 'protonmail.com', 'gmx.com', 'mail.com', 'ymail.com',
]);

export type PanelType = (typeof PANEL_TYPES)[number];
export type PanelCondition = (typeof CONDITIONS)[number];
export type Packaging = (typeof PACKAGING)[number];
export type Transport = (typeof TRANSPORTS)[number];
export type WeightUnit = (typeof WEIGHT_UNITS)[number];
export type LoadingOption = (typeof LOADING_OPTIONS)[number];

export type IntakeInput = {
  organization: string;
  contactName: string;
  workEmail: string;
  state: string;
  zip: string;
  transport: Transport | '';
  panelType: PanelType | '';
  condition: PanelCondition | '';
  count: string;
  weight: string;
  weightUnit: WeightUnit | '';
  packaging: Packaging | '';
  canSharePhotos: 'yes' | 'no' | '';
  loading: LoadingOption | '';
  desiredDate: string;
  pickupAddress: string;
  inquiryConsent: boolean;
  marketingOptIn: boolean;
  allowPersonalEmail: boolean;
};

export type FieldError = { field: string; message: string };
export type IntakeException = { code: string; message: string };

export type NormalizedIntake = {
  organization: string;
  contactName: string;
  workEmail: string;
  state: string;
  zip: string;
  transport: Transport;
  panelType: PanelType;
  condition: PanelCondition;
  count: number | null;
  weight: number | null;
  weightUnit: WeightUnit | null;
  packaging: Packaging;
  canSharePhotos: 'yes' | 'no' | null;
  loading: LoadingOption | null;
  desiredDate: string | null;
  pickupAddress: string | null;
  inquiryConsent: true;
  marketingOptIn: boolean;
  personalEmail: boolean;
};

export type IntakeDraft = {
  submitted: false;
  caseCreated: false;
  orderConfirmed: false;
  quoteApproved: false;
  logisticsConfirmed: false;
  referenceLabel: 'Preview reference — not submitted';
  stage: 'draft_pending_review';
  summary: NormalizedIntake;
  exceptions: IntakeException[];
  nextSteps: string[];
};

export type IntakeValidation =
  | { ok: false; errors: FieldError[]; exceptions: IntakeException[] }
  | { ok: true; value: NormalizedIntake; exceptions: IntakeException[]; draft: IntakeDraft };

export function emptyIntake(): IntakeInput {
  return {
    organization: '',
    contactName: '',
    workEmail: '',
    state: '',
    zip: '',
    transport: '',
    panelType: '',
    condition: '',
    count: '',
    weight: '',
    weightUnit: '',
    packaging: '',
    canSharePhotos: '',
    loading: '',
    desiredDate: '',
    pickupAddress: '',
    inquiryConsent: false,
    marketingOptIn: false,
    allowPersonalEmail: false,
  };
}

export const fictionalPreviewDraft: IntakeInput = {
  organization: 'North Example Solar',
  contactName: 'Preview Person',
  workEmail: 'preview.person@example.com',
  state: 'CA',
  zip: '94105',
  transport: 'pickup',
  panelType: 'unknown',
  condition: 'unknown',
  count: '40',
  weight: '',
  weightUnit: '',
  packaging: 'palletized',
  canSharePhotos: 'yes',
  loading: 'forklift',
  desiredDate: '',
  pickupAddress: '100 Example Road, San Francisco',
  inquiryConsent: true,
  marketingOptIn: false,
  allowPersonalEmail: false,
};

export function normalizeState(value: string): string | null {
  const text = value.trim().toLowerCase().replace(/\./g, '');
  if (/^[a-z]{2}$/.test(text)) {
    const code = text.toUpperCase();
    return US_STATES.some(([item]) => item === code) ? code : null;
  }
  const match = US_STATES.find(([, name]) => name.toLowerCase() === text);
  return match ? match[0] : null;
}

export function stateName(code: string): string {
  return US_STATES.find(([item]) => item === code)?.[1] ?? code;
}

export function zipPrefixState(zip: string): string | 'invalid' | 'unassigned' {
  const match = /^(\d{5})(?:-\d{4})?$/.exec(zip.trim());
  if (!match || match[1] === '00000') return 'invalid';
  const prefix = Number(match[1].slice(0, 3));
  for (const [start, end, state] of ZIP3_RANGES) {
    if (prefix >= start && prefix <= end) return state;
  }
  return 'unassigned';
}

export function photosRequired(input: Pick<IntakeInput, 'panelType' | 'condition'>): boolean {
  return input.condition === 'damaged' || input.condition === 'mixed' || input.condition === 'unknown'
    || input.panelType === 'thin-film' || input.panelType === 'mixed' || input.panelType === 'unknown';
}

function looksSensitive(value: string): boolean {
  if (/(?:\d[ -]*?){13,19}/.test(value)) return true;
  return /passport|social security|\bssn\b|card number|cvv|cvc/i.test(value);
}

function push(errors: FieldError[], field: string, message: string) {
  errors.push({ field, message });
}

export function validateIntake(input: IntakeInput, today = '2026-11-08'): IntakeValidation {
  const errors: FieldError[] = [];

  const organization = input.organization.trim();
  if (organization.length < 2 || organization.length > 120) push(errors, 'organization', 'Enter the organization name.');
  else if (looksSensitive(organization)) push(errors, 'organization', 'Remove payment card or identity document numbers.');

  const contactName = input.contactName.trim();
  if (contactName.length < 2 || contactName.length > 80) push(errors, 'contactName', 'Enter the person to contact.');
  else if (looksSensitive(contactName)) push(errors, 'contactName', 'Remove payment card or identity document numbers.');

  const workEmail = input.workEmail.trim();
  const emailOk = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(workEmail);
  let personalEmail = false;
  if (!emailOk) push(errors, 'workEmail', 'Enter a work email address, such as name@company.com.');
  else {
    const domain = workEmail.split('@')[1]?.toLowerCase() ?? '';
    personalEmail = FREE_EMAIL_DOMAINS.has(domain);
    if (personalEmail && !input.allowPersonalEmail) {
      push(errors, 'workEmail', 'This looks like a personal mailbox. Enter a work email, or continue with it for human review.');
    }
  }

  const state = normalizeState(input.state);
  if (!state) push(errors, 'state', 'Choose a U.S. state or the District of Columbia.');

  const zipState = zipPrefixState(input.zip);
  const zip = input.zip.trim();
  if (zipState === 'invalid') push(errors, 'zip', 'Enter a 5-digit ZIP code, or ZIP+4.');
  else if (state && zipState !== 'unassigned' && zipState !== state) {
    push(errors, 'zip', `This ZIP prefix is used for ${stateName(zipState)}, not ${stateName(state)}. Correct the state or the ZIP.`);
  }

  if (input.transport !== 'pickup' && input.transport !== 'dropoff') {
    push(errors, 'transport', 'Choose pickup or drop-off. Drop-off still needs a receiving site confirmed later.');
  }

  if (!(PANEL_TYPES as readonly string[]).includes(input.panelType)) push(errors, 'panelType', 'Choose a panel type, including Unknown.');
  if (!(CONDITIONS as readonly string[]).includes(input.condition)) push(errors, 'condition', 'Choose a condition, including Unknown.');
  if (!(PACKAGING as readonly string[]).includes(input.packaging)) push(errors, 'packaging', 'Choose how the panels are packed, including Unknown.');

  let count: number | null = null;
  if (input.count.trim()) {
    if (!/^\d+$/.test(input.count.trim())) push(errors, 'count', 'Enter a whole number of panels, or leave count blank and enter a weight.');
    else {
      count = Number(input.count.trim());
      if (count < 1 || count > 1_000_000) push(errors, 'count', 'Enter a panel count from 1 to 1,000,000, or use weight instead.');
    }
  }

  let weight: number | null = null;
  let weightUnit: WeightUnit | null = null;
  if (input.weight.trim()) {
    if (!/^\d+(\.\d+)?$/.test(input.weight.trim())) push(errors, 'weight', 'Enter a weight as a number, or leave weight blank and enter a panel count.');
    else {
      weight = Number(input.weight.trim());
      if (!(weight > 0) || weight > 100_000_000) push(errors, 'weight', 'Enter a weight above zero.');
    }
    if (!(WEIGHT_UNITS as readonly string[]).includes(input.weightUnit)) push(errors, 'weightUnit', 'Choose a unit: lb, kg, short ton, or metric tonne.');
    else weightUnit = input.weightUnit as WeightUnit;
  } else if (input.weightUnit) {
    push(errors, 'weight', 'Enter a weight for the selected unit, or clear the unit and provide a panel count.');
  }

  if (!input.count.trim() && !input.weight.trim()) push(errors, 'count', 'Enter a panel count or a weight and unit.');

  const needsPhotos = photosRequired(input);
  if (needsPhotos && input.canSharePhotos !== 'yes' && input.canSharePhotos !== 'no') {
    push(errors, 'canSharePhotos', 'Say whether photos can be shared during review. This preview does not upload files.');
  }

  let loading: LoadingOption | null = null;
  let pickupAddress: string | null = null;
  if (input.transport === 'pickup') {
    if (!(LOADING_OPTIONS as readonly string[]).includes(input.loading)) {
      push(errors, 'loading', 'Choose the loading situation at the site, including Unknown or None.');
    } else loading = input.loading as LoadingOption;
    const address = input.pickupAddress.trim();
    if (address.length < 8 || address.length > 200 || !/\d/.test(address)) {
      push(errors, 'pickupAddress', 'Enter the pickup street address, including a number. A city alone cannot be used to plan a pickup.');
    } else if (looksSensitive(address)) {
      push(errors, 'pickupAddress', 'Remove payment card or identity document numbers.');
    } else pickupAddress = address;
  }

  let desiredDate: string | null = null;
  if (input.desiredDate.trim()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.desiredDate)) push(errors, 'desiredDate', 'Enter the preferred date as YYYY-MM-DD, or leave it blank.');
    else if (input.desiredDate < today) push(errors, 'desiredDate', 'That date is in the past. Choose a later preference or leave the date blank. A date does not reserve a pickup.');
    else desiredDate = input.desiredDate;
  }

  if (!input.inquiryConsent) push(errors, 'inquiryConsent', 'Confirm you understand this preview is not submitted and is not an order.');

  if (errors.length) return { ok: false, errors, exceptions: [] };

  const exceptions: IntakeException[] = [{
    code: 'acceptance_not_confirmed',
    message: 'Acceptance, price, and schedule are not confirmed. Operations today support a self-service inquiry plus human approval.',
  }];
  if (personalEmail) exceptions.push({ code: 'personal_email', message: 'The email is a personal mailbox and would need human review.' });
  if (input.panelType === 'unknown' || input.panelType === 'mixed' || input.panelType === 'thin-film') {
    exceptions.push({ code: 'panel_type_review', message: 'Panel type is thin-film, mixed, or unknown, so acceptance has to be reviewed.' });
  }
  if (input.condition === 'damaged' || input.condition === 'mixed' || input.condition === 'unknown') {
    exceptions.push({ code: 'condition_review', message: 'Condition is damaged, mixed, or unknown, so the load needs review before any acceptance.' });
  }
  if (input.packaging === 'unknown' || input.packaging === 'loose' || input.packaging === 'mixed') {
    exceptions.push({ code: 'packaging_review', message: 'Packaging is loose, mixed, or unknown and would be checked before handling.' });
  }
  if (needsPhotos && input.canSharePhotos === 'no') {
    exceptions.push({ code: 'photos_unavailable', message: 'Photos are not available. Review may be limited until images are provided through an approved channel.' });
  }
  if (zipState === 'unassigned') {
    exceptions.push({ code: 'zip_unverified', message: 'The ZIP is not in the prefix list used here. A person would confirm it. This is not a coverage decision.' });
  }
  if (count === null && weight !== null) {
    exceptions.push({ code: 'weight_basis', message: 'Quantity is weight without a panel count. The unit would be checked during review.' });
  }
  if (desiredDate) {
    exceptions.push({ code: 'date_preference', message: 'The date is a preference only. It does not reserve equipment, a truck, or a receiving window.' });
  }
  if (input.transport === 'pickup') {
    exceptions.push({ code: 'logistics_unconfirmed', message: 'Pickup is requested. Collection is not scheduled and the address was not sent.' });
  } else {
    exceptions.push({ code: 'dropoff_site_unconfirmed', message: 'Drop-off is requested. A receiving site is not reserved.' });
  }

  const value: NormalizedIntake = {
    organization,
    contactName,
    workEmail,
    state: state as string,
    zip,
    transport: input.transport as Transport,
    panelType: input.panelType as PanelType,
    condition: input.condition as PanelCondition,
    count,
    weight,
    weightUnit,
    packaging: input.packaging as Packaging,
    canSharePhotos: needsPhotos ? input.canSharePhotos as 'yes' | 'no' : null,
    loading,
    desiredDate,
    pickupAddress,
    inquiryConsent: true,
    marketingOptIn: input.marketingOptIn === true,
    personalEmail,
  };

  return { ok: true, value, exceptions, draft: toDraft(value, exceptions) };
}

function toDraft(summary: NormalizedIntake, exceptions: IntakeException[]): IntakeDraft {
  return {
    submitted: false,
    caseCreated: false,
    orderConfirmed: false,
    quoteApproved: false,
    logisticsConfirmed: false,
    referenceLabel: previewReferenceLabel(),
    stage: 'draft_pending_review',
    summary,
    exceptions,
    nextSteps: [
      'Nothing was submitted. No case number, quote, or order exists.',
      'A person would have to review the organization, load, and location. That queue is not connected.',
      'Do not ship or drop off panels unless a later written confirmation names the destination, date, and receiving conditions.',
    ],
  };
}

export type TechnicalInput = {
  organization: string;
  contactName: string;
  workEmail: string;
  state: string;
  role: (typeof TECHNICAL_ROLES)[number] | '';
  note: string;
  inquiryConsent: boolean;
  marketingOptIn: boolean;
  allowPersonalEmail: boolean;
};

export function emptyTechnical(): TechnicalInput {
  return {
    organization: '', contactName: '', workEmail: '', state: '', role: '', note: '',
    inquiryConsent: false, marketingOptIn: false, allowPersonalEmail: false,
  };
}

export function validateTechnicalRequest(input: TechnicalInput): { ok: true; marketingOptIn: boolean } | { ok: false; errors: FieldError[] } {
  const probe = validateIntake({
    ...emptyIntake(),
    organization: input.organization,
    contactName: input.contactName,
    workEmail: input.workEmail,
    state: input.state,
    zip: '00000',
    transport: 'dropoff',
    panelType: 'unknown',
    condition: 'unknown',
    count: '1',
    packaging: 'unknown',
    canSharePhotos: 'no',
    inquiryConsent: input.inquiryConsent,
    marketingOptIn: input.marketingOptIn,
    allowPersonalEmail: input.allowPersonalEmail,
  });
  const errors: FieldError[] = [];
  if (!probe.ok) {
    for (const error of probe.errors) {
      if (['organization', 'contactName', 'workEmail', 'state', 'inquiryConsent'].includes(error.field)) errors.push(error);
    }
  }
  if (!(TECHNICAL_ROLES as readonly string[]).includes(input.role)) {
    errors.push({ field: 'role', message: 'Choose the kind of operation you want to discuss.' });
  }
  if (input.note.trim().length > 500) errors.push({ field: 'note', message: 'Keep the note under 500 characters.' });
  if (looksSensitive(input.note)) errors.push({ field: 'note', message: 'Remove payment card or identity document numbers.' });
  if (!normalizeState(input.state)) errors.push({ field: 'state', message: 'Choose a U.S. state or the District of Columbia.' });
  const unique = errors.filter((error, index) => errors.findIndex(item => item.field === error.field && item.message === error.message) === index);
  if (unique.length) return { ok: false, errors: unique };
  return { ok: true, marketingOptIn: input.marketingOptIn === true };
}

export type ScenarioInput = { configuration: (typeof SCENARIO_CONFIGS)[number] | ''; acknowledged: boolean };

export function reviewScenario(input: ScenarioInput): { ok: true; commercialCase: false; configuration: string; message: string } | { ok: false; errors: FieldError[] } {
  const errors: FieldError[] = [];
  if (!(SCENARIO_CONFIGS as readonly string[]).includes(input.configuration)) {
    errors.push({ field: 'configuration', message: 'Choose a published configuration name, or Not sure yet.' });
  }
  if (!input.acknowledged) {
    errors.push({ field: 'acknowledged', message: 'Confirm this is a published name, not an approved operating case or a price.' });
  }
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    commercialCase: false,
    configuration: input.configuration,
    message: 'Scenario review stayed in this preview. It is not a commercial case, quote, or order.',
  };
}
