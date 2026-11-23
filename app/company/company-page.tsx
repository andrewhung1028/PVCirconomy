"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { PublicHeader } from "../components/public-header";
import "../components/review-home.css";
import "./company.css";
import { companyFooterNote, companyHero, companySlides } from "./company-page-data";

function Arrow({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={direction === "left" ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M3 9h11M10 5l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function CompanyPage() {
  const [slide, setSlide] = useState(0);
  const count = companySlides.length;
  const go = (next: number) => setSlide((next + count) % count);

  useEffect(() => {
    document.documentElement.classList.add("pv-section-scroll");
    return () => {
      document.documentElement.classList.remove("pv-section-scroll");
    };
  }, []);

  return (
    <div className="pv-review company-page">
      <a className="pv-skip" href="#overview">Skip to Mission</a>
      <PublicHeader assistantInlineLinks assistantTechnologyAnchor="#mission" />

      <main>
        <section id="overview" className="pv-screen pv-hero" aria-labelledby="page-title">
          <img className="pv-hero-image" src={companyHero.poster} alt="" aria-hidden="true" />
          <div className="pv-hero-shade" />
          <div className="pv-hero-copy">
            <h1 id="page-title">{companyHero.title.split("\n").map((line, index) => <Fragment key={line}>{index > 0 && <br />}{line}</Fragment>)}</h1>
            <p>{companyHero.description}</p>
            <Link className="pv-button pv-button-white" href={companyHero.action.href}>{companyHero.action.label}<Arrow /></Link>
          </div>
          <a className="pv-down" href="#mission" aria-label="Continue to Our mission">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v16M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1.3" /></svg>
          </a>
        </section>

        <section
          id="mission"
          className="pv-screen company-slides"
          aria-roledescription="carousel"
          aria-label="Our mission"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") go(slide - 1);
            if (event.key === "ArrowRight") go(slide + 1);
          }}
        >
          {companySlides.map((item, index) => (
            <div
              key={item.id}
              className={`company-slide${index === slide ? " is-active" : ""}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${count}`}
              aria-hidden={index === slide ? undefined : true}
            >
              <img src={item.image} alt={index === slide ? item.imageAlt : ""} />
              <div className="company-slide-shade" />
              <div className="company-slide-copy">
                <p className="company-slide-count">{index + 1} / {count}</p>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </div>
            </div>
          ))}
          <button type="button" className="company-arrow company-prev" onClick={() => go(slide - 1)} aria-label="Previous slide"><Arrow direction="left" /></button>
          <button type="button" className="company-arrow company-next" onClick={() => go(slide + 1)} aria-label="Next slide"><Arrow /></button>
          <div className="company-slide-dots">
            {companySlides.map((item, index) => (
              <button key={item.id} type="button" onClick={() => go(index)} aria-label={`Go to slide ${index + 1}`} aria-current={index === slide ? "true" : undefined} />
            ))}
          </div>
          <footer className="pv-footer company-footer">
            <span>© {new Date().getFullYear()} PV Circonomy</span>
            <span>{companyFooterNote}</span>
            <a className="pv-text-button" href="#overview">Back to top</a>
          </footer>
        </section>
      </main>
    </div>
  );
}
