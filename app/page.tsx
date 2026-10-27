import { HomeIndex } from './components/circulator-explorer';
import Link from 'next/link';
import { Arrow, Action, EndCTA, Shell, ProductGrid } from './components/marketing';

export const metadata = { title: 'Solar’s next chapter | PV Circonomy', description: 'Give solar panels a next chapter. Estimate recycling costs, explore PV Circulator and source circular materials.' };

export default function Home() {
  return <Shell><div className="pc-home-indexed"><HomeIndex/>
    <section id="home-overview" className="pc-hero pc-home-hero">
      <video autoPlay muted loop playsInline poster="/PVCirconomy/images/circulator-poster.jpg" aria-label="PV Circulator separating a retired solar panel"><source src="/PVCirconomy/videos/pv-circulator-operation.mp4" type="video/mp4" /></video>
      <div className="pc-hero-shade" />
      <div className="pc-wrap pc-hero-content">
        <p className="pc-eyebrow"><span className="pc-live-dot" /> PV CIRCONOMY / SOLAR CIRCULARITY</p>
        <h1>A new life for solar.</h1>
        <p>From retired panels to renewed resources.</p>
        <div className="pc-actions"><Action href="/shop?type=recycling">Estimate & book recycling</Action><Action href="/solutions" secondary>Explore our solutions</Action></div>
      </div>
      <div className="pc-hero-foot"><span>PV CIRCULATOR / IN OPERATION</span><a href="#pathways">Find your way forward ↓</a><span>SCROLL TO EXPLORE</span></div>
    </section>

    <section className="pc-quickbar" aria-label="Quick access"><a href="/PVCirconomy/shop?type=recycling"><span className="pc-quick-icon">↗</span><span>Have panels to recycle?<small>Calculate a service estimate</small></span><Arrow /></a><a href="/PVCirconomy/business-case"><span className="pc-quick-icon">＋</span><span>Planning a recycling business?<small>Build your business case</small></span><Arrow /></a><a href="/PVCirconomy/circular-products"><span className="pc-quick-icon">↻</span><span>Looking for circular materials?<small>Explore products & specifications</small></span><Arrow /></a></section>

    <section id="pathways" className="pc-section pc-wrap">
      <div className="pc-section-head"><div><p className="pc-eyebrow pc-green">A CIRCULAR ECONOMY. A CLEAR PATH.</p><p className="pc-section-caption">For panel owners, recyclers<br />and the makers of what comes next.</p></div><h2>Less waste.<br />More ways forward.</h2></div>
      <div className="pc-paths pc-home-paths">{[
        { n: '01', audience: 'FOR PANEL OWNERS & OPERATORS', title: 'Recycle with a plan.', text: 'From a single site to a repowering project. Find a recycling route, explore collection options and review an estimate.', link: '/services', cta: 'Explore recycling services', icon: '↻', image: 'solar-circularity.png', alt: 'Illustrative retired solar panels prepared for recycling' },
        { n: '02', audience: 'FOR RECYCLERS & INVESTORS', title: 'Build your capacity.', text: 'Meet PV Circulator. Explore the separation process, then model the economics of your own recycling operation.', link: '/solutions#circulator', cta: 'Discover PV Circulator', icon: '↗', image: 'circulator-poster.jpg', alt: 'PV Circulator processing a solar panel' },
        { n: '03', audience: 'FOR MATERIAL BUYERS', title: 'Source the next cycle.', text: 'Discover recovered glass, aluminum, copper and cell materials. Start with your specification and application.', link: '/circular-products', cta: 'Explore circular products', icon: '◎', image: 'material-glass.svg', alt: 'Illustrative recovered glass fragments' }
      ].map(p => <article key={p.n}><Link href={p.link} className="pc-path-image"><img src={'/PVCirconomy/images/' + p.image} alt={p.alt} loading="lazy" /></Link><div className="pc-path-top"><span className="pc-index">{p.n} / {p.audience}</span><span className="pc-path-icon" aria-hidden="true">{p.icon}</span></div><h3>{p.title}</h3><p>{p.text}</p><Action href={p.link} secondary>{p.cta}</Action></article>)}</div>
    </section>

    <section id="home-circulator" className="pc-feature pc-home-feature pc-media-story"><div className="pc-feature-photo" role="img" aria-label="A solar panel being separated by PV Circulator equipment"><span className="pc-photo-label">TECHNOLOGY WITH A PURPOSE / PV CIRCULATOR</span></div><div className="pc-feature-copy"><p className="pc-eyebrow pc-green">ENGINEERED FOR THE NEXT CYCLE</p><h2>PV Circulator</h2><p>Separation technology for the next material cycle.</p><div className="pc-feature-points"><span>01 / Dry physical separation</span><span>02 / Material recovery pathways</span><span>03 / Project-specific deployment</span></div><div className="pc-actions"><Action href="/solutions#circulator">Explore PV Circulator</Action><Action href="/shop?type=equipment" secondary>Equipment inquiry</Action></div></div></section>

    <section id="home-business-case" className="pc-business-band"><div className="pc-wrap pc-business-grid"><div><p className="pc-eyebrow">FROM CIRCULAR VISION TO BUSINESS DECISION</p><h2>Make the<br />numbers work.</h2></div><div><p>What could PV recycling mean for your business? Explore processing revenue, operating costs and indicative payback before you invest.</p><Action href="/business-case">Open business case calculator</Action><p className="pc-fine">Scenario modeling with editable assumptions. Not a guaranteed return.</p></div><div className="pc-orbit" aria-hidden="true"><span>PV<br />↻</span><i /><b /></div></div></section>

    <section id="home-products" className="pc-section pc-wrap"><div className="pc-section-head"><div><p className="pc-eyebrow pc-green">CIRCULAR PRODUCTS</p><p className="pc-section-caption">Recovered resources.<br />New industrial possibilities.</p></div><div><h2>A new beginning.<br />Material by material.</h2><a className="pc-text-link" href="/PVCirconomy/circular-products">Explore all circular products <Arrow /></a></div></div><ProductGrid /><p className="pc-fine">Illustrative material categories. Availability and specifications are confirmed by batch.</p></section>

    <section id="home-connected" className="pc-loop"><div className="pc-wrap"><div className="pc-section-head"><p className="pc-eyebrow">THE WHOLE CYCLE, CONNECTED</p><h2>Responsibility<br />doesn’t end at collection.</h2></div><div className="pc-loop-steps">{['Plan & collect', 'Separate & recover', 'Connect materials', 'Document the journey'].map((t, i) => <div key={t}><span>0{i + 1}</span><h3>{t}</h3><Arrow /></div>)}</div><div className="pc-loop-bottom"><p>Bring recycling, EPR-related documentation and downstream needs into one project conversation.</p><Action href="/solutions" secondary>See the complete approach</Action></div></div></section>
    <div id="home-next-step"><EndCTA /></div>
  </div></Shell>;
}
