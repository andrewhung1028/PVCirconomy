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
  return <aside className="pc-announcement" aria-label="網站消息"><span>{settings.announcementText}</span>{settings.announcementLinkText && <a href={siteHref(settings.announcementHref)}>{settings.announcementLinkText} <span aria-hidden="true">↗</span></a>}</aside>;
}

type Message = { role: 'user' | 'assistant'; text: string; links?: GuideReply['links'] };
const greeting: Message = { role: 'assistant', text: '你好，我是 PV Circonomy 客服導覽。你想回收太陽能板、評估 PV Circulator，還是採購循環材料？目前為知識導覽示範，尚未連線 OpenAI。' };
export function AssistantBar() {
  const [open, setOpen] = useState(false); const [draft, setDraft] = useState(''); const [messages, setMessages] = useState<Message[]>([greeting]);
  const input = useRef<HTMLInputElement>(null); const opener = useRef<HTMLButtonElement>(null); const log = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => { if (open && log.current) log.current.scrollTop = log.current.scrollHeight; }, [messages, open]);
  function close() { setOpen(false); opener.current?.focus(); }
  function ask(text: string) { const value = text.trim().slice(0, 1000); if (!value) return; const reply = guideReply(value); setMessages(m => [...m, { role: 'user' as const, text: value }, { role: 'assistant' as const, ...reply }].slice(-31)); setDraft(''); }
  function submit(event: FormEvent) { event.preventDefault(); ask(draft); }
  return <><div className="pc-assistant-bar"><button ref={opener} className="pc-ask-trigger" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-controls="pv-assistant"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4h16v12H9l-5 4V4Z" stroke="currentColor" strokeWidth="1.5"/><path d="M8 9h8m-8 3h5" stroke="currentColor"/></svg><strong>AI 客服</strong><span>回收費用如何計算？</span><b aria-hidden="true">↑</b></button><Link href="/shop?type=recycling" className="pc-bar-book">預約回收 <span aria-hidden="true">↗</span></Link></div>
    {open && <section id="pv-assistant" className="pc-chat-panel" role="dialog" aria-modal="false" aria-labelledby="pv-assistant-title" onKeyDown={e => { if (e.key === 'Escape') close(); }}><header><div><h2 id="pv-assistant-title">PV Circonomy 客服</h2><p>知識導覽示範 · OpenAI 尚未連線</p></div><button onClick={close} aria-label="關閉客服">×</button></header><div ref={log} className="pc-chat-log" role="log" aria-live="polite" aria-relevant="additions">{messages.map((m, i) => <div key={i} className={'pc-chat-message pc-chat-' + m.role}><span>{m.role === 'user' ? '你' : 'PV CIRCONOMY'}</span><p>{m.text}</p>{m.links && <div className="pc-chat-links">{m.links.map(l => <Link href={l.href} key={l.href} onClick={() => setOpen(false)}>{l.label} ↗</Link>)}</div>}</div>)}</div><div className="pc-chat-suggestions">{['回收費用', 'PV Circulator 設備', '循環材料'].map(q => <button onClick={() => ask(q)} key={q}>{q}</button>)}</div><form onSubmit={submit} className="pc-chat-form"><label className="pc-visually-hidden" htmlFor="pv-chat-input">輸入你的問題</label><input ref={input} id="pv-chat-input" placeholder="輸入你的問題…" value={draft} maxLength={1000} onChange={e => setDraft(e.target.value)} autoComplete="off"/><button disabled={!draft.trim()} aria-label="送出問題" type="submit">↑</button></form><p className="pc-chat-note">對話只保留於此頁面；請勿輸入敏感資訊。</p></section>}
  </>;
}
