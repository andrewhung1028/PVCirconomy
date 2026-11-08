export type JourneyIntent = 'service' | 'equipment';

export type JourneyContext = {
  intent: JourneyIntent | '';
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  stripped: string[];
};

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;

const PII_KEYS = new Set([
  'email', 'e-mail', 'mail', 'name', 'firstname', 'lastname', 'first_name', 'last_name',
  'fullname', 'full_name', 'company', 'organization', 'organisation', 'org', 'phone', 'tel',
  'mobile', 'address', 'street', 'zip', 'postal', 'postalcode', 'postal_code', 'ssn',
  'passport', 'message', 'contact', 'firstname', 'card', 'cardnumber',
]);

export function safeToken(value: string | null | undefined): string {
  if (!value) return '';
  const token = value.trim();
  if (token.length < 1 || token.length > 80) return '';
  if (/[@\s/?#&=+%]|%40|%2f/i.test(token)) return '';
  if (!/^[A-Za-z0-9._-]+$/.test(token)) return '';
  return token;
}

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase().replace(/\[|\]/g, '');
  if (PII_KEYS.has(lower)) return true;
  return /email|phone|passport|address|company|organization|lastname|firstname/.test(lower);
}

export function readJourneyContext(search: string): JourneyContext {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const ctx: JourneyContext = {
    intent: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    stripped: [],
  };
  for (const key of params.keys()) {
    const lower = key.toLowerCase();
    if (isSensitiveKey(lower)) {
      ctx.stripped.push(key);
      continue;
    }
    if (lower === 'intent') {
      const value = params.get(key) || '';
      if (value === 'service' || value === 'equipment') ctx.intent = value;
      else ctx.stripped.push(key);
      continue;
    }
    if ((UTM_KEYS as readonly string[]).includes(lower)) {
      const safe = safeToken(params.get(key));
      if (safe) ctx[lower as (typeof UTM_KEYS)[number]] = safe;
      else ctx.stripped.push(key);
      continue;
    }
    ctx.stripped.push(key);
  }
  return ctx;
}

export function buildJourneyHref(path: string, ctx: Partial<JourneyContext> & { intent?: JourneyIntent | '' }): string {
  const url = new URL(path, 'https://preview.pvcirconomy.local');
  if (ctx.intent === 'service' || ctx.intent === 'equipment') url.searchParams.set('intent', ctx.intent);
  for (const key of UTM_KEYS) {
    const value = safeToken(ctx[key]);
    if (value) url.searchParams.set(key, value);
  }
  return url.pathname + url.search + url.hash;
}

export function businessCaseHref(ctx: Partial<JourneyContext> = {}): string {
  const url = new URL('https://businesscase.pvcirconomy.com/');
  url.searchParams.set('utm_source', safeToken(ctx.utm_source) || 'pvcirconomy_preview');
  url.searchParams.set('utm_medium', safeToken(ctx.utm_medium) || 'referral');
  url.searchParams.set('utm_campaign', safeToken(ctx.utm_campaign) || 'equipment_journey');
  const content = safeToken(ctx.utm_content);
  if (content) url.searchParams.set('utm_content', content);
  url.searchParams.set('intent', 'equipment');
  return url.toString();
}

export const BASE_PATH = '/PVCirconomy';

export function publicPath(route: string): string {
  if (route === '/') return `${BASE_PATH}/`;
  return `${BASE_PATH}${route.endsWith('/') ? route : `${route}/`}`;
}
