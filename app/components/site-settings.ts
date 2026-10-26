export type SiteSettings = { announcementEnabled: boolean; announcementText: string; announcementLinkText: string; announcementHref: string; assistantEnabled: boolean };
export const SETTINGS_KEY = 'pvcirconomy:site-settings:v1';
export const SETTINGS_EVENT = 'pvcirconomy-settings-change';
export const defaultSettings: SiteSettings = {
  announcementEnabled: true,
  announcementText: 'Give retired solar panels their next chapter.',
  announcementLinkText: 'Estimate recycling costs',
  announcementHref: '/shop?type=recycling',
  assistantEnabled: true,
};
export function safeHref(value: string) {
  if (value.startsWith('/') && !value.startsWith('//') && !/[\\\s\u0000-\u001f]/.test(value)) return value;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
export function sanitizeSettings(value: unknown): SiteSettings {
  if (!value || typeof value !== 'object') return { ...defaultSettings };
  const v = value as Partial<SiteSettings>;
  return {
    announcementEnabled: typeof v.announcementEnabled === 'boolean' ? v.announcementEnabled : defaultSettings.announcementEnabled,
    announcementText: typeof v.announcementText === 'string' && v.announcementText.trim() ? v.announcementText.trim().slice(0, 140) : defaultSettings.announcementText,
    announcementLinkText: typeof v.announcementLinkText === 'string' ? v.announcementLinkText.trim().slice(0, 40) : defaultSettings.announcementLinkText,
    announcementHref: typeof v.announcementHref === 'string' ? safeHref(v.announcementHref) || defaultSettings.announcementHref : defaultSettings.announcementHref,
    assistantEnabled: typeof v.assistantEnabled === 'boolean' ? v.assistantEnabled : true,
  };
}
export function readSettings(): SiteSettings {
  try { return sanitizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')); } catch { return { ...defaultSettings }; }
}
export function saveSettings(settings: SiteSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(sanitizeSettings(settings)));
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}
export function siteHref(path: string) { return path.startsWith('/') ? '/PVCirconomy' + path : path; }
