'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import './marketing.css';
import { RecyclingBooking } from './recycling-booking';
import { Announcement, AssistantBar, useSiteSettings } from './site-utilities';

const nav = [['Solutions', '/solutions'], ['Services', '/services'], ['Circular Products', '/circular-products'], ['Discover', '/discover']] as const;
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
      <Link href="/" aria-label="PV Circonomy home" className="pc-logo"><span className="pc-infinity-mark"><img src="/PVCirconomy/images/pv-circonomy-white.png" alt="PV Circonomy infinity brand icon" /></span></Link>
      <button className="pc-menu-toggle" aria-expanded={open} aria-controls="pc-navigation" onClick={() => { setOpen(!open); closeDiscover(); }}>{open ? 'Close −' : 'Menu +'}</button>
      <nav id="pc-navigation" className={open ? 'pc-nav pc-nav-open' : 'pc-nav'} aria-label="Main navigation">
        {nav.map(([name, url]) => name === 'Discover' ? <div className="pc-discover-wrap" key={url}>
          <button ref={discoverTrigger} className="pc-discover-trigger" aria-expanded={discoverOpen} aria-controls="pc-discover-panel"
            onMouseEnter={() => { if (window.matchMedia('(hover: hover)').matches) setDiscoverOpen(true); }}
            onClick={() => setDiscoverOpen(v => !v)}
            onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setDiscoverOpen(true); setTimeout(() => firstDiscoverLink.current?.focus(), 0); } }}>
            <span>{name}</span><span aria-hidden="true" className="pc-discover-chevron">⌄</span>
          </button>
          {discoverOpen && <div id="pc-discover-panel" className="pc-mega" aria-label="Discover navigation"><div className="pc-mega-inner">
            {[
              { label: 'Resources', links: [['Explore Discover', '/discover'], ['PV Circulator brochure', '/2026_PV_Circulator_Solution_Brochure.pdf'], ['Solution overview', '/PV_Circulator_Solution_Overview.pdf'], ['Recycling FAQ', '/services#faq']] },
              { label: 'Learn', links: [['Technology & video', '/solutions#circulator'], ['Business Case Calculator', '/business-case'], ['Methodology & assumptions', '/methodology'], ['Material passports', '/circular-products#passport']] },
              { label: 'Company', links: [['About PV Circonomy', '/discover#company'], ['Our circular approach', '/solutions'], ['Partnerships & equipment', '/shop?type=equipment'], ['Contact & service requests', '/shop']] },
            ].map((group, i) => <section key={group.label}><h2>{group.label}</h2>{group.links.map(([label, href], j) => <Link key={href} href={href} ref={i === 0 && j === 0 ? firstDiscoverLink : undefined} onClick={() => { closeDiscover(); setOpen(false); }}>{label}</Link>)}</section>)}
          </div><Link className="pc-mega-all" href="/discover" onClick={() => { closeDiscover(); setOpen(false); }}>Explore Discover <Arrow /></Link></div>}
        </div> : <Link href={url} key={url} aria-current={path === url ? 'page' : undefined} onMouseEnter={() => closeDiscover()}><span>{name}</span></Link>)}
        <Link href="/shop" className="pc-nav-shop" aria-current={path === '/shop' ? 'page' : undefined} onMouseEnter={() => closeDiscover()}><span>Shop</span><Arrow /></Link>
      </nav>
    </header>
    {discoverOpen && <button className="pc-mega-backdrop" aria-label="Close Discover navigation" tabIndex={-1} onClick={() => closeDiscover(true)}/>}
    <main id="pc-content">{children}</main>
    <footer className="pc-footer"><div className="pc-footer-top"><Link href="/" className="pc-logo"><img src="/PVCirconomy/images/pv-circonomy-logo.svg" alt="PV Circonomy" /></Link><p>A new life for solar.<br />A better use of resources.</p><Link href="/shop?type=recycling">Estimate & book recycling <Arrow /></Link></div><div className="pc-footer-bottom"><span>© {new Date().getFullYear()} PV Circonomy</span><span>English</span><Link href="/discover">About this preview</Link><Link href="/settings">System settings</Link></div></footer>
    {settings.assistantEnabled && <AssistantBar />}
  </div>;
}
export function Arrow() { return <svg className="pc-arrow" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 16 16 4M4 4h12v12" stroke="currentColor" strokeWidth="1.4" /></svg>; }
export function Action({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) { return <Link className={'pc-button' + (secondary ? ' pc-button-secondary' : '')} href={href}>{children}<Arrow /></Link>; }
export function Intro({ label, title, description }: { label: string; title: string; description: string }) { return <section className="pc-intro pc-wrap"><p className="pc-eyebrow">{label}</p><h1>{title}</h1><p className="pc-lead">{description}</p></section>; }
export function EndCTA({ label = 'THE NEXT STEP' }: { label?: string } = {}) { return <section className="pc-end"><div className="pc-wrap"><p className="pc-eyebrow">{label}</p><h2>Put circularity into motion.</h2><Action href="/shop?type=recycling">Estimate & book recycling</Action></div></section>; }
export function ProductGrid() { return <div className="pc-products">{products.map((p, i) => <article className="pc-product" key={p.name}><div className={'pc-material pc-material-' + i}><img src={'/PVCirconomy/images/material-' + p.name.toLowerCase() + '.svg'} alt={p.name + ' — illustrative recovered material'} loading="lazy" /><small>ILLUSTRATIVE MATERIAL CATEGORY</small></div><p className="pc-eyebrow">{p.tag}</p><h3>{p.name}</h3><p>{p.description}</p><Link className="pc-text-link" href={'/circular-products#' + p.name.toLowerCase()}>Explore material passport <Arrow /></Link><Link className="pc-text-link" href={'/shop?type=materials&material=' + p.name}>Request a quote <Arrow /></Link></article>)}</div>; }

export function ShopForm() {
  const params=useSearchParams(); const initial=params.get('type');
  const [tab,setTab]=useState(initial==='equipment'||initial==='materials'?initial:'recycling');
  const [material,setMaterial]=useState(params.get('material')||'Glass'); const [submitted,setSubmitted]=useState(false);
  useEffect(()=>{const t=params.get('type');setTab(t==='equipment'||t==='materials'?t:'recycling');setMaterial(params.get('material')||'Glass');setSubmitted(false);},[params]);
  function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSubmitted(true);}
  return <section className="pc-wrap pc-shop"><div className="pc-tabs" role="tablist" aria-label="Select your need">{[['recycling','01 / Recycle panels'],['equipment','02 / Explore equipment'],['materials','03 / Source materials']].map(([key,label])=><button key={key} role="tab" id={'tab-'+key} aria-controls="request-panel" aria-selected={tab===key} tabIndex={tab===key?0:-1} onClick={()=>{setTab(key);setSubmitted(false);}} onKeyDown={e=>{const keys=['recycling','equipment','materials'];const i=keys.indexOf(tab);const next=e.key==='ArrowRight'?keys[(i+1)%3]:e.key==='ArrowLeft'?keys[(i+2)%3]:e.key==='Home'?keys[0]:e.key==='End'?keys[2]:null;if(next){e.preventDefault();setTab(next);setSubmitted(false);document.getElementById('tab-'+next)?.focus();}}}>{label}</button>)}</div><div id="request-panel" role="tabpanel" aria-labelledby={'tab-'+tab} tabIndex={0}>{tab==='recycling'?<RecyclingBooking/>:<div className="pc-shop-grid"><div><p className="pc-eyebrow">{tab==='equipment'?'PV CIRCULATOR / EQUIPMENT INQUIRY':'CIRCULAR PRODUCTS / RFQ'}</p><h2>{tab==='equipment'?'Build your recycling capacity.':'Resources for what comes next.'}</h2><p>{tab==='equipment'?'Tell us about your operation and deployment needs.':'Share your specification, volume and delivery needs.'}</p><div className="pc-demo-note"><strong>PUBLIC PREVIEW</strong><p>No live orders, emails, payments or reservations. Form data stays on this page. No request is sent.</p></div>{tab==='equipment'&&<Link className="pc-text-link" href="/business-case">Open the business case calculator <Arrow/></Link>}</div><form className="pc-form" key={tab} onSubmit={submit} onChange={()=>setSubmitted(false)}>{tab==='materials'?<><label>Material<select value={material} onChange={e=>setMaterial(e.target.value)}>{products.map(p=><option key={p.name}>{p.name}</option>)}</select></label><label>Required volume (metric tonnes)<input type="number" min="0.01" step="0.01" required placeholder="e.g. 20"/></label><label>Specification and application<textarea required placeholder="Purity, particle size, intended use, documentation…"/></label></>:<><label>Equipment configuration<select name="configuration" defaultValue={['Economic','Basic','Premium'].includes(params.get('configuration')||'')?params.get('configuration')||'Economic':'To be confirmed'}><option>To be confirmed</option><option>Economic</option><option>Basic</option><option>Premium</option></select></label><label>Monthly panel volume<input type="number" min="1" required placeholder="e.g. 10000"/></label><label>Project stage<select><option>Initial feasibility</option><option>Planning a facility</option><option>Expanding an operation</option></select></label><label>Project requirements<textarea required placeholder="Location, target capacity, deployment timeline…"/></label></>}<div className="pc-form-pair"><label>Your name<input name="name" autoComplete="name" required/></label><label>Work email<input name="email" type="email" autoComplete="email" required/></label></div><label>{tab==='materials'?'Delivery location':'Project location'}<input required placeholder="City, state / region, country"/></label><button className="pc-button" type="submit">Preview inquiry</button>{submitted&&<div className="pc-confirm" role="status"><strong>Inquiry preview complete.</strong><p>Your details passed local validation. Nothing has been sent.</p></div>}</form></div>}</div></section>;
}

export function MediaStory({ image, alt, label, title, description, children, layout = 'stacked', cards }: { image: string; alt: string; label: string; title: string; description: string; children?: ReactNode; layout?: 'stacked' | 'left' | 'right'; cards?: { title: string; body: string; symbol: string }[] }) {
  return <section className={'pc-editorial pc-editorial-' + layout}>
    <figure className="pc-editorial-figure"><img className="pc-editorial-image" src={'/PVCirconomy/images/' + image} alt={alt} loading="lazy" />{image.startsWith('solar-circularity') && <figcaption>Illustrative solar circularity imagery</figcaption>}</figure>
    <div className="pc-editorial-caption"><p className="pc-eyebrow">{label}</p><h2>{title}</h2><p>{description}</p>{children && <div className="pc-actions">{children}</div>}</div>
    {cards && <div className="pc-info-cards">{cards.map(card => <article key={card.title}><span aria-hidden="true">{card.symbol}</span><h3>{card.title}</h3><p>{card.body}</p></article>)}</div>}
  </section>;
}
