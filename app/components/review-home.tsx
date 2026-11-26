"use client";
import {ResidentialNote} from './residential-note';
import { useEffect, useState } from "react";
import { DeliveryPlanner } from "./delivery-planner";
import type { QuotationBundle } from "../../lib/quotation-types";
import { BatchEstimator } from "./batch-estimator";
import { PublicHeader } from "./public-header";
import "./marketing.css";
import "./review-home.css";
const sections = [
  ["recycling", "Recycling"],
  ["pricing", "Pricing"],
  ["delivery", "Delivery"],
  ["traceability", "Traceability"],
  ["faq", "FAQ"],
] as const;
function Arrow() {
  return (
    <svg
      width="20"
      height="16"
      viewBox="0 0 24 20"
      fill="none"
      aria-hidden="true"
    >
      <path d="M1 10h21M14 2l8 8-8 8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
export function ReviewHome() {
  const [active, setActive] = useState("recycling");
  const [heroPlaying, setHeroPlaying] = useState(true);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const [heroVideoFailed, setHeroVideoFailed] = useState(false);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    setHeroPlaying(!preference.matches);
    const update = () => {
      setHeroPlaying(!preference.matches);
      setHeroVideoReady(false);
      setHeroVideoFailed(false);
    };
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    document.documentElement.classList.add("pv-section-scroll");
    return () => document.documentElement.classList.remove("pv-section-scroll");
  }, []);
  const [deliveryProgress, setDeliveryProgress] = useState(0);
  const [bookingExpanded, setBookingExpanded] = useState(false);
  const [deliveryQuotation, setDeliveryQuotation] =
    useState<QuotationBundle | null>(null);
  useEffect(() => {
    try {
      const stored = JSON.parse(
        sessionStorage.getItem("pv-delivery-quotation") || "null",
      );
      if (
        stored?.recordId &&
        stored?.accessToken &&
        stored?.document?.text &&
        Array.isArray(stored.lines) &&
        new Date(stored.expiresAt).getTime() > Date.now()
      )
        setDeliveryQuotation(stored);
    } catch {}
  }, []);
  function planDelivery(bundle: QuotationBundle) {
    setDeliveryQuotation(bundle);
    try {
      sessionStorage.setItem("pv-delivery-quotation", JSON.stringify(bundle));
    } catch {}
  }
  function invalidateDeliveryQuote() {
    setDeliveryQuotation(null);
    try {
      sessionStorage.removeItem("pv-delivery-quotation");
    } catch {}
  }
  useEffect(() => {
    const nodes = sections
      .map(([id]) => document.getElementById(id))
      .filter((e): e is HTMLElement => !!e);
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const marker = innerHeight * 0.4;
        let selected = nodes[0]?.id;
        for (const el of nodes)
          if (el.getBoundingClientRect().top <= marker) selected = el.id;
        if (selected) setActive(selected);
      });
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
    };
  }, []);
  function jump(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    history.replaceState(null, "", "#" + id);
  }

  const light =
    active === "pricing" || active === "delivery" || active === "faq";
  return (
    <div
      className={
        "pv-review" +
        (light ? " pv-light-nav" : "") +
        (active === "faq" ? " pv-faq-nav" : "") +
        (bookingExpanded && active === "delivery" ? " pv-booking-mode" : "")
      }
    >
      <a className="pv-skip" href="#pricing">
        Skip to estimate
      </a>
      <PublicHeader showMarketPicker onHomeJump={(section) => jump(section)} assistantInlineLinks assistantTechnologyAnchor="#traceability" />
      <nav className="pv-dots" aria-label="Quick section navigation">
        {sections.map(([id, label]) => (
          <a
            href={"#" + id}
            key={id}
            aria-label={label + " section"}
            aria-current={active === id ? "location" : undefined}
            onClick={(e) => {
              e.preventDefault();
              jump(id);
            }}
          >
            <i />
            <span>{label}</span>
          </a>
        ))}
      </nav>
      <main>
        <section
          id="recycling"
          className="pv-screen pv-hero"
          aria-labelledby="pv-hero-title"
        >
          <img
            className="pv-hero-image"
            src="/images/PVCirconomy_recycling_hero_poster.jpg"
            alt="Solar panel recycling process"
            fetchPriority="high"
          />
          {heroPlaying && (
            <div
              className={
                "pv-hero-video" + (heroVideoReady ? " is-ready" : "")
              }
              aria-hidden="true"
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster="/images/PVCirconomy_recycling_hero_poster.jpg"
                tabIndex={-1}
                onLoadedData={() => setHeroVideoReady(true)}
                onCanPlay={() => setHeroVideoReady(true)}
                onPlaying={() => setHeroVideoReady(true)}
                onError={() => setHeroVideoFailed(true)}
              >
                <source
                  src="/videos/PVCirconomy_recycling_hero_1080p.webm"
                  type="video/webm"
                />
                <source
                  src="/videos/PVCirconomy_recycling_hero_1080p.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          )}
          {heroPlaying && !heroVideoReady && !heroVideoFailed && (
            <div className="pv-hero-loading" aria-hidden="true">
              <span>
                <img src="/images/pv-infinity.svg" alt="" />
                <i />
              </span>
            </div>
          )}
          <div className="pv-hero-shade" />
          <div className="pv-hero-copy">
            <h1 id="pv-hero-title">
              Solar panel recycling.
              <br />
              Stay compliant &amp;
              <br />
              Pay less.
            </h1>
            <p>
              California DTSC-permitted recycling, with online quotes, pickup
              planning and traceable records that keep recovered materials circular.
            </p>
          </div>
          <a
            className="pv-down"
            href="#pricing"
            aria-label="Continue to pricing"
            onClick={(e) => {
              e.preventDefault();
              jump("pricing");
            }}
          >
            <svg width="26" height="30" viewBox="0 0 26 30" fill="none">
              <path
                d="M13 1v26M2 16l11 11 11-11"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </a>
        </section>
        <section
          id="pricing"
          className="pv-screen pv-split"
          aria-labelledby="pv-pricing-title"
        >
          <figure className="pv-photo">
            <img
              src="/images/solar-circularity.png"
              alt="Illustrative retired solar panels stacked on pallets, not a photograph of a company facility"
              loading="lazy"
            />
            <figcaption>
              Illustrative shipment · not a company facility
            </figcaption>
          </figure>
          <div className="pv-panel">
            <h2 id="pv-pricing-title">
              What will
              <br />
              it cost?
            </h2>
            <BatchEstimator
              onPlanDelivery={planDelivery}
              onQuoteInvalidated={invalidateDeliveryQuote}
            />
          </div>
        </section>
        <section
          id="delivery"
          className={
            "pv-screen pv-split pv-delivery" +
            (bookingExpanded ? " pv-booking-expanded" : "")
          }
          aria-labelledby="pv-delivery-title"
        >
          <figure className="pv-photo">
            <img
              src="/images/solar-circularity.png"
              alt="Illustrative palletized solar panel delivery preparation"
              loading="lazy"
            />
            <figcaption>Illustrative delivery preparation</figcaption>
          </figure>
          <div className="pv-panel">
            <h2 id="pv-delivery-title">
              Plan your <br />
              delivery.
            </h2>
            <ol className="pv-delivery-steps" aria-label="Delivery progress">
              {[
                "Review your recycling quotation",
                "Choose delivery method & time windows",
                "Submit your recycling order request",
              ].map((label, index) => (
                <li
                  key={label}
                  className={deliveryProgress >= index + 1 ? "is-reached" : ""}
                  aria-current={
                    deliveryProgress === index + 1 ? "step" : undefined
                  }
                >
                  {label}
                </li>
              ))}
            </ol>
            <DeliveryPlanner
              quotation={deliveryQuotation}
              onBookingOpenChange={setBookingExpanded}
              onProgressChange={setDeliveryProgress}
            />
            <details className="pv-details">
              <summary>Acceptance &amp; packaging</summary>
              <p>
                Before shipping, agree packaging, pallet dimensions, loading
                equipment, truck access and a receiving appointment with our
                receiving team.
              </p>
            </details>
            <details className="pv-details">
              <summary>Seven-day batch scheduling</summary>
              <p>
                Deliveries may be divided into scheduled batches with specified
                dates and quantities; batches may be seven days apart. Agree a
                minimum delivered quantity for any volume rate. We confirm exact
                delivery windows, reservation length and any below-minimum rate
                with you before shipment.
              </p>
            </details>
            <details className="pv-details">
              <summary>What if condition differs on arrival?</summary>
              <p>
                The receiving team documents affected quantities and differences
                with photos, explains any price change and obtains your approval
                before processing. Terms for cancellations, rejected loads and
                return transport are confirmed with you before shipment.
              </p>
            </details>
            <details className="pv-details">
              <summary>Is my estimate a confirmed order?</summary>
              <p>
                Your processing quotation is valid for seven days from its issue
                date. Choose your delivery method and time windows, then submit
                a recycling order request. Selected windows are held pending
                company confirmation. Transportation is priced separately.
                Questions? Use Get Help at the top of the page.
              </p>
            </details>
            <button
              type="button"
              className="pv-button pv-payment"
              disabled
              aria-describedby="pv-payment-note"
            >
              Proceed to payment <Arrow />
            </button>
            <p className="pv-note" id="pv-payment-note">
              Payment is not available yet. Order acceptance and delivery dates
              require confirmation.
            </p>
          </div>
        </section>
        <section
          id="traceability"
          className="pv-screen pv-tech"
          aria-labelledby="pv-tech-title"
        >
          <figure className="pv-tech-media">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/images/recycling-easycycle-poster.jpg"
              aria-label="EasyCycle traceability and recycling records"
            >
              <source src="/videos/recycling-easycycle.mp4" type="video/mp4" />
            </video>
            <ul
              className="pv-trace-benefits"
              aria-label="Recycling service benefits"
            >
              <li>
                <h3>Traceable</h3>
                <p>Recycling passport</p>
                <span>A verifiable record for every batch.</span>
              </li>
              <li>
                <h3>Measurable</h3>
                <p>Recovery &amp; carbon data</p>
                <span>Evidence for sustainability reporting.</span>
              </li>
              <li>
                <h3>Trusted</h3>
                <p>Tamper-evident records</p>
                <span>Uploaded directly by recycling equipment.</span>
              </li>
            </ul>
          </figure>
          <div className="pv-tech-band">
            <h2 id="pv-tech-title">
              Your panels.
              <br />A recycling passport.
            </h2>
            <div>
              <p>
                Your recycling service includes a traceable record of how your
                panels were processed and where recovered materials went—helping
                reduce reporting effort and support credible sustainability
                communications.
              </p>
              <a className="pv-text-button" href="/easycycle/">
                Explore EasyCycle →
              </a>
            </div>
          </div>
        </section>
        <section
          id="faq"
          className="pv-screen pv-faq"
          aria-labelledby="pv-faq-title"
        >
          <div className="pv-faq-heading">
            <h2 id="pv-faq-title">
              Questions,
              <br />
              answered.
            </h2>
            <p>What to know before requesting a quote or arranging delivery.</p>
            <a
              className="pv-button"
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                jump("pricing");
              }}
            >
              Get your estimate <Arrow />
            </a>
          </div>
          <div className="pv-faq-answers">
            <details className="pv-details">
              <summary>What information do I need for an estimate?</summary>
              <p>
                Have your panel manufacturer and model, rated watts, quantity,
                condition and US location ready. A label photo can help identify
                the panel. Model lookup covers panels in our verified database.
                Photo upload shows a preview only for now.
              </p>
            </details>
            <details className="pv-details">
              <summary>Does the price include transport?</summary>
              <p>
                No. Processing and transport are quoted separately. <ResidentialNote/> Truck
                processing rates are priced per accepted panel. Qualified
                Trailer processing rates settle by measured weight, including
                pallets and packaging; third-party scale tickets are accepted.
                You can arrange your own transport and select it during delivery
                planning.
              </p>
            </details>
            <details className="pv-details">
              <summary>Can you receive broken or incomplete panels?</summary>
              <p>
                Broken panels and panels missing frames or junction boxes can be
                reviewed. Tell us the affected quantities before shipping.
                Missing-component adjustments apply only to affected processing
                charges. Double-glass panels have no separate surcharge. Confirm
                the applicable rate and acceptance before delivery.
              </p>
            </details>
            <details className="pv-details">
              <summary>Can I split a large delivery into batches?</summary>
              <p>
                Yes, with agreed dates and quantities. Batches may be seven days
                apart. Minimum delivered quantities and the applicable volume
                rate must be agreed before shipment; receiving slots are held
                only after you submit an order request.
              </p>
            </details>
            <details className="pv-details">
              <summary>What will my recycling passport show?</summary>
              <p>
                Your recycling passport brings together batch records, material
                recovery information and supporting environmental data to help
                with project closeout, reporting and sustainability
                communications. Your service confirmation specifies the
                reporting scope and delivery timing.
              </p>
              <a className="pv-text-button" href="/easycycle/">
                Explore EasyCycle →
              </a>
            </details>
            <details className="pv-details">
              <summary>
                What happens if the received panels differ from my description?
              </summary>
              <p>
                The receiving team documents differences and affected quantities
                with photos, explains any price change and obtains your approval
                before processing. Terms for cancellations, rejected loads and
                return transport are confirmed with you before shipment.
              </p>
            </details>
            <details className="pv-details">
              <summary>Does using this page submit an order?</summary>
              <p>
                A request is submitted when you complete your delivery details
                and select Submit recycling order request. You receive a
                reference number and your selected time windows are held pending
                company confirmation. Generating or emailing a quotation alone
                does not submit an order request.
              </p>
            </details>
          </div>
          <footer className="pv-footer">
            <span>© {new Date().getFullYear()} PV Circonomy</span>
            <span>USD processing quotations · valid for 7 days</span>
            <button
              className="pv-text-button"
              onClick={() => jump("recycling")}
            >
              Back to top
            </button>
          </footer>
        </section>
      </main>
    </div>
  );
}
