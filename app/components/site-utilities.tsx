'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { defaultSettings, readSettings, SETTINGS_EVENT, SETTINGS_KEY, SiteSettings, siteHref } from './site-settings';
import { guideReply, GuideReply } from './assistant-knowledge';

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  useEffect(() => { const refresh = () => setSettings(readSettings()); refresh(); const sync = (e: StorageEvent) => { if (!e.key || e.key === SETTINGS_KEY) refresh(); }; window.addEventListener(SETTINGS_EVENT, refresh); window.addEventListener('storage', sync); return () => { window.removeEventListener(SETTINGS_EVENT, refresh); window.removeEventListener('storage', sync); }; }, []);
  return settings;
}
export function Announcement({ settings }: { settings: SiteSettings }) {
  if (!settings.announcementEnabled) return null;
  return <aside className="pc-announcement" aria-label="Website announcement"><span>{settings.announcementText}</span>{settings.announcementLinkText && <a href={siteHref(settings.announcementHref)}>{settings.announcementLinkText} <span aria-hidden="true">↗</span></a>}</aside>;
}

type Message = { role: 'user' | 'assistant'; text: string; links?: GuideReply['links']; source?: 'guide' | 'ai' };
const greeting: Message = { role: 'assistant', text: 'Have a question about panel recycling? I can help you understand the information to prepare, processing estimates and delivery options.', source: 'guide' };
export function AssistantBar({ inlineLinks = false, technologyAnchor = '#technology', onOpen, actionLabel = 'AI assistant' }: { inlineLinks?: boolean; technologyAnchor?: string; onOpen?: () => void; actionLabel?: string } = {}) {
  const [open, setOpen] = useState(false); const [draft, setDraft] = useState(''); const [messages, setMessages] = useState<Message[]>([greeting]);
  const [ai, setAi] = useState(false); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState('');
  const input = useRef<HTMLInputElement>(null); const opener = useRef<HTMLButtonElement>(null); const log = useRef<HTMLDivElement>(null); const root = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  useEffect(() => { if (open) { input.current?.focus(); fetch('/api/assistant/').then(r => r.ok ? r.json() : {enabled:false}).then(data => setAi(data.enabled === true)).catch(() => setAi(false)); } }, [open]);
  useEffect(() => { if (open && log.current) log.current.scrollTop = log.current.scrollHeight; }, [messages, open, busy]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: globalThis.PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);
  function close() { setOpen(false); opener.current?.focus(); }
  async function ask(text: string) {
    const value = text.trim().slice(0, 1000); if (!value || pending.current) return;
    const history = [...messages, { role: 'user' as const, text: value }]; setMessages(history.slice(-31)); setDraft(''); setNotice('');
    if (!ai) { const reply = guideReply(value); setMessages(m => [...m, {role:'assistant' as const, ...reply, source:'guide' as const}].slice(-31)); return; }
    pending.current = true; setBusy(true);
    try {
      const response = await fetch('/api/assistant/', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ messages: history.filter(m => m !== greeting).slice(-16).map(m => ({role:m.role, content:m.text})) }), signal: AbortSignal.timeout(28000) });
      if (!response.ok) throw new Error(); const data = await response.json();
      if (typeof data.text !== 'string' || !data.text.trim()) throw new Error();
      setMessages(m => [...m, {role:'assistant' as const, text:data.text, source:'ai' as const}].slice(-31));
    } catch { const reply = guideReply(value); setNotice('AI is unavailable right now. The website guide is shown below instead.'); setMessages(m => [...m, {role:'assistant' as const, ...reply, source:'guide' as const}].slice(-31)); }
    finally { pending.current = false; setBusy(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void ask(draft); }
  return <div ref={root} className="pc-header-assistant">
    <button ref={opener} aria-label={actionLabel} title={actionLabel} className="pc-ask-trigger" onClick={() => { if (!open) onOpen?.(); setOpen(v => !v); }} aria-expanded={open} aria-controls="pv-assistant"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v12H9l-5 4V4Z"/><path d="M8 9h8m-8 3h5"/></svg></button>
    {open && <section id="pv-assistant" className="pc-chat-panel" role="region" aria-labelledby="pv-assistant-title" onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }}>
      <div className="pc-chat-response">
        <header><div><h2 id="pv-assistant-title">PV Circonomy Assistant</h2><p>{ai ? 'AI assistant' : 'Website guide · AI not connected'}</p></div></header>
        <div ref={log} className="pc-chat-log" role="log" aria-live="polite" aria-relevant="additions">{messages.slice(-3).map((m, i) => <div key={`${m.role}-${i}`} className={'pc-chat-message pc-chat-' + m.role}><span>{m.role === 'user' ? 'You' : m.source === 'ai' ? 'AI ASSISTANT' : 'WEBSITE GUIDE'}</span><p>{m.text}</p>{m.links && <div className="pc-chat-links">{m.links.map(l => <Link href={inlineLinks ? (l.href.includes('recycling') ? '#pricing' : l.href.includes('services') ? '#delivery' : technologyAnchor) : l.href} key={l.href} onClick={() => setOpen(false)}>{l.label} ↗</Link>)}</div>}</div>)}{busy && <p role="status">Preparing an answer…</p>}</div>
      </div>
      <div className="pc-chat-compose">
        <div className="pc-chat-suggestions">{['Recycling costs', 'What should I prepare?', 'Pickup or delivery?'].map(q => <button type="button" disabled={busy} onClick={() => void ask(q)} key={q}>{q}</button>)}</div>
        {notice && <p className="pc-chat-note" role="status">{notice}</p>}
        <form onSubmit={submit} className="pc-chat-form"><label className="pc-visually-hidden" htmlFor="pv-chat-input">Your question</label><input ref={input} id="pv-chat-input" placeholder="Ask a recycling question…" value={draft} maxLength={1000} onChange={e => setDraft(e.target.value)} autoComplete="off"/><button disabled={!draft.trim() || busy} aria-label="Send question" type="submit"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5"/></svg></button></form>
        <p className="pc-chat-note">{ai ? 'Questions are sent to the AI provider. ' : 'Replies use website information. '}Do not enter personal, payment or confidential information. Answers do not confirm prices or bookings.</p>
      </div>
      <button type="button" className="pc-chat-close" onClick={close} aria-label="Close assistant"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.5"/></svg></button>
    </section>}
  </div>;
}
