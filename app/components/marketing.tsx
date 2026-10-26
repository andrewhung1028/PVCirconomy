'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import './marketing.css';
import { Announcement, AssistantBar, useSiteSettings } from './site-utilities';

const nav = [['Solutions', '解決方案', '/solutions'], ['Services', '回收服務', '/services'], ['Circular Products', '循環產品', '/circular-products'], ['Discover', '探索', '/discover']] as const;
import { products } from './marketing-data';
export function Shell({ children }: { children: ReactNode }) {
  const settings = useSiteSettings();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const discoverTrigger = useRef<HTMLButtonElement>(null);
  const firstDiscoverLink = useRef<HTMLAnchorElement>(null);
  useEffect(() => { setOpen(false); setDiscoverOpen(false); }, [path]);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 40); onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll); }, []);
  function closeDiscover(restoreFocus = false) { setDiscoverOpen(false); if (restoreFocus) discoverTrigger.current?.focus(); }
  return <div className={'pc-site' + (path === '/' || path === '/solutions' ? ' pc-immersive' : '') + (settings.announcementEnabled ? ' pc-has-announcement' : '') + (settings.assistantEnabled ? ' pc-has-assistant' : '')}>
    <Announcement settings={settings}/>
    <a className="pc-skip" href="#pc-content">Skip to content</a>
    <header className={'pc-header' + (scrolled || open || discoverOpen ? ' pc-header-solid' : '')}
      onMouseLeave={() => { if (window.matchMedia('(hover: hover)').matches) closeDiscover(); }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) closeDiscover(); }}
      onKeyDown={event => { if (event.key === 'Escape') { if (discoverOpen) closeDiscover(true); else setOpen(false); } }}>
      <Link href="/" aria-label="PV Circonomy home" className="pc-logo"><img src="/PVCirconomy/images/pv-circonomy-logo.svg" alt="PV Circonomy" /></Link>
      <button className="pc-menu-toggle" aria-expanded={open} aria-controls="pc-navigation" onClick={() => { setOpen(!open); closeDiscover(); }}>{open ? 'Close −' : 'Menu +'}</button>
      <nav id="pc-navigation" className={open ? 'pc-nav pc-nav-open' : 'pc-nav'} aria-label="Main navigation">
        {nav.map(([name, zh, url]) => name === 'Discover' ? <div className="pc-discover-wrap" key={url}>
          <button ref={discoverTrigger} className="pc-discover-trigger" aria-expanded={discoverOpen} aria-controls="pc-discover-panel"
            onMouseEnter={() => { if (window.matchMedia('(hover: hover)').matches) setDiscoverOpen(true); }}
            onClick={() => setDiscoverOpen(v => !v)}
            onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setDiscoverOpen(true); setTimeout(() => firstDiscoverLink.current?.focus(), 0); } }}>
            <span>{name}</span><small lang="zh-Hant">{zh} <span aria-hidden="true">⌄</span></small>
          </button>
          {discoverOpen && <div id="pc-discover-panel" className="pc-mega" aria-label="Discover 探索選單"><div className="pc-mega-inner">
            {[
              { label: 'Resources', zh: '資源', links: [['所有探索內容', '/discover'], ['PV Circulator 型錄', '/2026_PV_Circulator_Solution_Brochure.pdf'], ['方案簡介', '/PV_Circulator_Solution_Overview.pdf'], ['回收常見問題', '/services#faq']] },
              { label: 'Learn', zh: '知識', links: [['技術與運作影片', '/solutions#circulator'], ['Business Case Calculator', '/business-case'], ['試算方法與假設', '/methodology'], ['材料履歷', '/circular-products#passport']] },
              { label: 'Company', zh: '公司', links: [['關於 PV Circonomy', '/discover#company'], ['循環經濟理念', '/solutions'], ['合作與設備詢問', '/shop?type=equipment'], ['聯繫與服務需求', '/shop']] },
            ].map((group, i) => <section key={group.label}><h2>{group.label}<span lang="zh-Hant">{group.zh}</span></h2>{group.links.map(([label, href], j) => <Link key={href} href={href} ref={i === 0 && j === 0 ? firstDiscoverLink : undefined} onClick={() => { closeDiscover(); setOpen(false); }}>{label}</Link>)}</section>)}
          </div><Link className="pc-mega-all" href="/discover" onClick={() => { closeDiscover(); setOpen(false); }}>Explore Discover / 探索更多 <Arrow /></Link></div>}
        </div> : <Link href={url} key={url} aria-current={path === url ? 'page' : undefined} onMouseEnter={() => closeDiscover()}><span>{name}</span><small lang="zh-Hant">{zh}</small></Link>)}
        <Link href="/shop" className="pc-nav-shop" aria-current={path === '/shop' ? 'page' : undefined} onMouseEnter={() => closeDiscover()}><span>Shop<small lang="zh-Hant">線上商店</small></span><Arrow /></Link>
      </nav>
    </header>
    {discoverOpen && <button className="pc-mega-backdrop" aria-label="關閉探索選單" tabIndex={-1} onClick={() => closeDiscover(true)}/>}
    <main id="pc-content">{children}</main>
    <footer className="pc-footer"><div className="pc-footer-top"><Link href="/" className="pc-logo"><img src="/PVCirconomy/images/pv-circonomy-logo.svg" alt="PV Circonomy" /></Link><p>A new life for solar.<br />A better use of resources.</p><Link href="/shop?type=recycling">Estimate & book recycling <Arrow /></Link></div><div className="pc-footer-bottom"><span>© {new Date().getFullYear()} PV Circonomy</span><span>English · 繁體中文導覽</span><Link href="/discover">About this preview</Link><Link href="/settings">系統設定</Link></div></footer>
    {settings.assistantEnabled && <AssistantBar />}
  </div>;
}
export function Arrow() { return <svg className="pc-arrow" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 16 16 4M4 4h12v12" stroke="currentColor" strokeWidth="1.4" /></svg>; }
export function Action({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) { return <Link className={'pc-button' + (secondary ? ' pc-button-secondary' : '')} href={href}>{children}<Arrow /></Link>; }
export function Intro({ label, title, description }: { label: string; title: string; description: string }) { return <section className="pc-intro pc-wrap"><p className="pc-eyebrow">{label}</p><h1>{title}</h1><p className="pc-lead">{description}</p></section>; }
export function EndCTA() { return <section className="pc-end"><div className="pc-wrap"><p className="pc-eyebrow">THE NEXT STEP</p><h2>Put circularity<br />into motion.</h2><Action href="/shop?type=recycling">Estimate & book recycling</Action></div></section>; }
export function ProductGrid() { return <div className="pc-products">{products.map((p, i) => <article className="pc-product" key={p.name}><div className={'pc-material pc-material-' + i}><img src={'/PVCirconomy/images/material-' + p.name.toLowerCase() + '.svg'} alt={p.name + ' — illustrative recovered material'} loading="lazy" /><small>ILLUSTRATIVE MATERIAL CATEGORY</small></div><p className="pc-eyebrow">{p.tag}</p><h3>{p.name}</h3><p>{p.description}</p><Link className="pc-text-link" href={'/circular-products#' + p.name.toLowerCase()}>Explore material passport <Arrow /></Link><Link className="pc-text-link" href={'/shop?type=materials&material=' + p.name}>Request a quote <Arrow /></Link></article>)}</div>; }

export function ShopForm() {
  const params = useSearchParams(); const initial = params.get('type');
  const [tab, setTab] = useState(initial === 'equipment' || initial === 'materials' ? initial : 'recycling');
  const [quantity, setQuantity] = useState(Number(params.get('quantity')) >= 1 && Number(params.get('quantity')) <= 1000000 ? Math.floor(Number(params.get('quantity'))) : 100); const [pickup, setPickup] = useState(params.get('method') === 'pickup'); const [material, setMaterial] = useState(params.get('material') || 'Glass'); const [submitted, setSubmitted] = useState(false);
  useEffect(() => { const t = params.get('type'); setTab(t === 'equipment' || t === 'materials' ? t : 'recycling'); setMaterial(params.get('material') || 'Glass'); const q = Number(params.get('quantity')); setQuantity(Number.isInteger(q) && q >= 1 && q <= 1000000 ? q : 100); setPickup(params.get('method') === 'pickup'); setSubmitted(false); }, [params]);
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setSubmitted(true); }
  return <section className="pc-wrap pc-shop"><div className="pc-tabs" role="tablist" aria-label="Select your need">{[['recycling', '01 / Recycle panels'], ['equipment', '02 / Explore equipment'], ['materials', '03 / Source materials']].map(([key, label]) => <button key={key} role="tab" id={'tab-' + key} aria-controls="request-panel" aria-selected={tab === key} onKeyDown={e => { const keys = ['recycling', 'equipment', 'materials']; const index = keys.indexOf(tab); const next = e.key === 'ArrowRight' ? keys[(index + 1) % 3] : e.key === 'ArrowLeft' ? keys[(index + 2) % 3] : e.key === 'Home' ? keys[0] : e.key === 'End' ? keys[2] : null; if (next) { e.preventDefault(); setTab(next); setSubmitted(false); document.getElementById('tab-' + next)?.focus(); } }} tabIndex={tab === key ? 0 : -1} onClick={() => { setTab(key); setSubmitted(false); }}>{label}</button>)}</div><div className="pc-shop-grid" id="request-panel" role="tabpanel" aria-labelledby={'tab-' + tab} tabIndex={0}><div><p className="pc-eyebrow">{tab === 'recycling' ? 'RECYCLING / ESTIMATE & REQUEST' : tab === 'equipment' ? 'PV CIRCULATOR / EQUIPMENT INQUIRY' : 'CIRCULAR PRODUCTS / RFQ'}</p><h2>{tab === 'recycling' ? 'Your panels.\nTheir next chapter.' : tab === 'equipment' ? 'Build your recycling capacity.' : 'Resources for what comes next.'}</h2><p>{tab === 'recycling' ? 'Explore an illustrative price, then try the booking request flow.' : tab === 'equipment' ? 'Tell us about your operation and deployment needs.' : 'Share your specification, volume and delivery needs.'}</p><div className="pc-demo-note"><strong>PUBLIC PREVIEW</strong><p>No live orders, emails, payments or reservations. Form data stays in this page and is cleared on reload. No request is sent.</p></div>{tab === 'recycling' && <div className="pc-estimate"><span>Illustrative estimate / USD</span><strong>{Number.isInteger(quantity) && quantity >= 1 && quantity <= 1000000 ? '$' + (quantity * 10 + (pickup ? 250 : 0)).toLocaleString('en-US') : '—'}</strong><p>Demo rate: $10/panel{pickup ? ' + $250 collection' : ' · self-delivery'}. Placeholder pricing for interface testing, not a commercial quote.</p></div>}{tab === 'equipment' && <Link className="pc-text-link" href="/business-case">Open the business case calculator <Arrow /></Link>}</div><form onSubmit={submit} onChange={() => setSubmitted(false)} className="pc-form" key={tab}>
    {tab === 'recycling' ? <><label>Number of panels<input type="number" min="1" max="1000000" step="1" required value={Number.isFinite(quantity) ? quantity : ''} onChange={e => { setQuantity(e.target.value === '' ? NaN : Number(e.target.value)); setSubmitted(false); }} /></label><label>Panel condition<select required><option>Intact crystalline-silicon panels</option><option>Damaged panels — assessment required</option><option>Other — assessment required</option></select></label><label>Service method<select value={pickup ? 'pickup' : 'dropoff'} onChange={e => { setPickup(e.target.value === 'pickup'); setSubmitted(false); }}><option value="dropoff">Self-delivery</option><option value="pickup">Request collection</option></select></label><label>Preferred date<input type="date" required min={new Date().toLocaleDateString('en-CA')} /></label></> : tab === 'materials' ? <><label>Material<select aria-label="Material" value={material} onChange={e => setMaterial(e.target.value)}>{products.map(p => <option key={p.name}>{p.name}</option>)}</select></label><label>Required volume (metric tonnes)<input type="number" min="0.01" step="0.01" required placeholder="e.g. 20" /></label><label>Specification and application<textarea required placeholder="Purity, particle size, intended use, required documentation…" /></label></> : <><label>Monthly panel volume<input type="number" min="1" required placeholder="e.g. 10000" /></label><label>Project stage<select><option>Initial feasibility</option><option>Planning a facility</option><option>Expanding an operation</option></select></label><label>Project requirements<textarea required placeholder="Location, target capacity, deployment timeline…" /></label></>}
    <div className="pc-form-pair"><label>Your name<input name="name" autoComplete="name" required placeholder="Full name" /></label><label>Work email<input name="email" type="email" autoComplete="email" required placeholder="you@company.com" /></label></div><label>{tab === 'materials' ? 'Delivery location' : 'Project location'}<input required placeholder="City, state / region, country" /></label><button className="pc-button" type="submit">{tab === 'recycling' ? 'Preview booking request' : 'Preview inquiry'} <Arrow /></button>{submitted && <div className="pc-confirm" role="status"><strong>Demo {tab === 'recycling' ? 'booking request' : 'inquiry'} complete.</strong><p>Your details passed local validation. Nothing has been sent or booked. Reloading this page clears the form.</p></div>}</form></div></section>;
}

export function MediaStory({ image, alt, label, title, description, children, layout = 'stacked', cards }: { image: string; alt: string; label: string; title: string; description: string; children?: ReactNode; layout?: 'stacked' | 'left' | 'right'; cards?: { title: string; body: string; symbol: string }[] }) {
  return <section className={'pc-editorial pc-editorial-' + layout}>
    <figure className="pc-editorial-figure"><img className="pc-editorial-image" src={'/PVCirconomy/images/' + image} alt={alt} loading="lazy" />{image.startsWith('solar-circularity') && <figcaption>Illustrative solar circularity imagery</figcaption>}</figure>
    <div className="pc-editorial-caption"><p className="pc-eyebrow">{label}</p><h2>{title}</h2><p>{description}</p>{children && <div className="pc-actions">{children}</div>}</div>
    {cards && <div className="pc-info-cards">{cards.map(card => <article key={card.title}><span aria-hidden="true">{card.symbol}</span><h3>{card.title}</h3><p>{card.body}</p></article>)}</div>}
  </section>;
}
