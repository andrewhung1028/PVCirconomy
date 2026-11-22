"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { PublicHeader } from "./public-header";
import "./review-home.css";

type PageAction = { label: string; href: string };
type PageSection = {
  id: string;
  label: string;
  title: string;
  body: string[];
  image: string;
  imageAlt: string;
  caption?: string;
  items?: string[];
  action?: PageAction;
};

export type UnifiedPublicPageProps = {
  pageLabel: string;
  hero: {
    title: string;
    description: string;
    poster: string;
    video?: string;
    videoWebm?: string;
    action?: PageAction;
  };
  sections: PageSection[];
  footerNote: string;
};

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 9h11M10 5l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function MultilineTitle({ children }: { children: string }) {
  return <>{children.split("\n").map((line, index) => <Fragment key={line}>{index > 0 && <br />}{line}</Fragment>)}</>;
}

export function UnifiedPublicPage({ pageLabel, hero, sections, footerNote }: UnifiedPublicPageProps) {
  const heroId = "overview";
  const [active, setActive] = useState(heroId);
  const navigation = useMemo(
    () => [[heroId, pageLabel], ...sections.map((section) => [section.id, section.label])] as const,
    [pageLabel, sections],
  );

  useEffect(() => {
    document.documentElement.classList.add("pv-section-scroll");
    const elements = navigation
      .map(([id]) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { threshold: [0.35, 0.6] });
    elements.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("pv-section-scroll");
    };
  }, [navigation]);

  const firstSection = sections[0];

  return (
    <div className={`pv-review${active !== heroId ? " pv-light-nav" : ""}`}>
      <a className="pv-skip" href={`#${heroId}`}>Skip to {pageLabel}</a>
      <PublicHeader assistantInlineLinks assistantTechnologyAnchor={sections[0] ? `#${sections[0].id}` : "#overview"} />
      <nav className="pv-dots" aria-label={`${pageLabel} sections`}>
        {navigation.map(([id, label]) => (
          <a key={id} href={`#${id}`} aria-current={active === id ? "step" : undefined}>
            <i />
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <main>
        <section id={heroId} className="pv-screen pv-hero" aria-labelledby="page-title">
          <img className="pv-hero-image" src={hero.poster} alt="" aria-hidden="true" />
          {(hero.video || hero.videoWebm) && (
            <div className="pv-hero-video">
              <video autoPlay muted loop playsInline poster={hero.poster}>
                {hero.videoWebm && <source src={hero.videoWebm} type="video/webm" />}
                {hero.video && <source src={hero.video} type="video/mp4" />}
              </video>
            </div>
          )}
          <div className="pv-hero-shade" />
          <div className="pv-hero-copy">
            <h1 id="page-title"><MultilineTitle>{hero.title}</MultilineTitle></h1>
            <p>{hero.description}</p>
            {hero.action && <Link className="pv-button pv-button-white" href={hero.action.href}>{hero.action.label}<Arrow /></Link>}
          </div>
          {firstSection && (
            <a className="pv-down" href={`#${firstSection.id}`} aria-label={`Continue to ${firstSection.label}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v16M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1.3" /></svg>
            </a>
          )}
        </section>

        {sections.map((section, sectionIndex) => (
          <section id={section.id} className="pv-screen pv-split" aria-labelledby={`${section.id}-title`} key={section.id}>
            <figure className="pv-photo">
              <img src={section.image} alt={section.imageAlt} />
              {section.caption && <figcaption>{section.caption}</figcaption>}
            </figure>
            <div className="pv-panel">
              <h2 id={`${section.id}-title`}>{section.title}</h2>
              <div className="pv-unified-copy">
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items && (
                  <ol className="pv-delivery-steps">
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ol>
                )}
                {section.action && <Link className="pv-button" href={section.action.href}>{section.action.label}<Arrow /></Link>}
              </div>
              {sectionIndex === sections.length - 1 && (
                <footer className="pv-footer pv-unified-footer">
                  <span>© {new Date().getFullYear()} PV Circonomy</span>
                  <span>{footerNote}</span>
                  <a className="pv-text-button" href={`#${heroId}`}>Back to top</a>
                </footer>
              )}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
