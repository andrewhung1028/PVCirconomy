"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AssistantBar } from "./site-utilities";
import "./review-home.css";

type HomeSection = "recycling" | "pricing" | "delivery" | "traceability";

function Mark() {
  return (
    <img
      className="pv-brand-mark"
      width="48"
      height="24"
      src="/images/pv-infinity.svg"
      alt=""
      aria-hidden="true"
    />
  );
}

function Arrow() {
  return (
    <svg width="20" height="16" viewBox="0 0 24 20" fill="none" aria-hidden="true">
      <path d="M1 10h21M14 2l8 8-8 8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function PublicHeader({
  solid = false,
  onHomeJump,
  assistant = true,
  assistantInlineLinks = false,
  assistantTechnologyAnchor = "#technology",
}: {
  solid?: boolean;
  onHomeJump?: (section: HomeSection) => void;
  assistant?: boolean;
  assistantInlineLinks?: boolean;
  assistantTechnologyAnchor?: string;
}) {
  const [account, setAccount] = useState<{ email: string; name: string; role: string } | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [accountStatus, setAccountStatus] = useState("");
  const [menu, setMenu] = useState(false);
  const [panel, setPanel] = useState<"equipment" | "company" | null>(null);
  const [equipmentTopic, setEquipmentTopic] = useState<"solution" | "businesscase" | "circulator" | "upcycling" | "easycycle">("circulator");
  const [companyTopic, setCompanyTopic] = useState<"about" | "mission" | "approach" | "contact">("about");
  const header = useRef<HTMLElement>(null);
  const accountButton = useRef<HTMLButtonElement>(null);
  const panelOpener = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    fetch("/api/auth/session/", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setAccount(data.user);
        setGoogleReady(Boolean(data.googleConfigured));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) {
        setMenu(false);
        setPanel(null);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  function closeAll() {
    setMenu(false);
    setPanel(null);
  }

  function goHome(section: HomeSection) {
    closeAll();
    if (onHomeJump) onHomeJump(section);
  }

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout/", { method: "POST" });
      if (!response.ok) throw new Error();
      location.reload();
    } catch {
      setAccountStatus("Sign out could not be completed. Please retry.");
    }
  }

  return (
    <header
      ref={header}
      className={`pv-header${solid ? " pv-header-solid" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          closeAll();
          (panelOpener.current || accountButton.current)?.focus();
        }
      }}
    >
      <Link
        href="/"
        className="pv-brand"
        aria-label="PV Circonomy home"
        onClick={(event) => {
          if (!onHomeJump) return;
          event.preventDefault();
          goHome("recycling");
        }}
      >
        <Mark />
        <span>PV Circonomy</span>
      </Link>

      <div className="pv-header-right">
        <nav className="pv-topnav" aria-label="Company navigation">
          <Link
            href="/"
            onClick={(event) => {
              if (!onHomeJump) return;
              event.preventDefault();
              goHome("recycling");
            }}
          >
            Recycling
          </Link>
          <button
            type="button"
            aria-expanded={panel === "equipment"}
            aria-controls="pv-company-panel"
            onClick={(event) => {
              panelOpener.current = event.currentTarget;
              setMenu(false);
              setPanel((value) => (value === "equipment" ? null : "equipment"));
            }}
          >
            PV Circulator
          </button>
          <button
            type="button"
            className="pv-nav-disabled"
            disabled
            aria-disabled="true"
            title="Coming soon"
          >
            Company
          </button>
          <button type="button" className="pv-nav-disabled" disabled aria-disabled="true" title="Coming soon">Shop</button>
        </nav>
        {assistant && <AssistantBar inlineLinks={assistantInlineLinks} technologyAnchor={assistantTechnologyAnchor} onOpen={closeAll} />}
        <button
          ref={accountButton}
          className="pv-menu"
          type="button"
          aria-label={menu ? "Close account menu" : "Open account menu"}
          aria-expanded={menu}
          aria-controls="pv-account-menu"
          onClick={(event) => {
            panelOpener.current = event.currentTarget;
            setPanel(null);
            setMenu((value) => !value);
          }}
        >
          <svg width="25" height="20" viewBox="0 0 25 20" fill="none" aria-hidden="true">
            <path
              d={menu ? "M3 2l19 16M22 2L3 18" : "M1 3h23M1 10h23M1 17h23"}
              stroke="currentColor"
              strokeWidth="1.3"
            />
          </svg>
        </button>
      </div>

      {panel && (
        <div id="pv-company-panel" className={`pv-header-panel${panel === "equipment" ? " is-equipment" : ""}`}>
          <button
            className="pv-panel-close"
            type="button"
            aria-label="Close company information"
            onClick={() => {
              setPanel(null);
              panelOpener.current?.focus();
            }}
          >
            Close
          </button>
          {panel === "equipment" ? (
            <>
              <nav className="pv-company-topics" aria-label="PV Circulator information">
                {([
                  ["solution", "Our Solution", "/solutions/"],
                  ["businesscase", "Business Case", "/business-case/"],
                  ["circulator", "PV Circulator", "/pv-circulator/"],
                  ["upcycling", "Upcycling", "/material-upcycling/"],
                  ["easycycle", "EasyCycle", "/easycycle/"],
                ] as const).map(([id, label, href]) => (
                  <Link
                    key={id}
                    href={href}
                    data-preview-active={equipmentTopic === id}
                    onMouseEnter={() => setEquipmentTopic(id)}
                    onFocus={() => setEquipmentTopic(id)}
                    onClick={closeAll}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="pv-company-content" aria-live="polite">
                <h2>{({ solution: "Our Solution", businesscase: "Business Case", circulator: "PV Circulator", upcycling: "Upcycling", easycycle: "EasyCycle" })[equipmentTopic]}</h2>
                {equipmentTopic === "solution" ? (
                  <>
                    <p>See how owners pay less, recyclers earn more, and recovered materials stay in circulation.</p>
                    <p>Follow the story from the coming decommissioning wave to PV Circulator, material upcycling and EasyCycle—and discover your role in the circular solar economy.</p>
                  </>
                ) : equipmentTopic === "businesscase" ? (
                  <><p>Model the economics of a PV recycling line for your region: processing fee, material revenue, operating cost and annual EBITDA for PV Circulator, shredding and hot-knife routes.</p><p>Results are estimates based on published operating assumptions; you can request a follow-up after running your case.</p></>
                ) : equipmentTopic === "circulator" ? (
                  <>
                    <p>Automated, layer-by-layer PV recycling for cleaner material streams, lower downstream processing and more value from each panel.</p>
                    <p>Explore performance, output quality, feedstock, configurations and facility-planning specifications. Technology developed by TSGC.</p>
                  </>
                ) : equipmentTopic === "upcycling" ? (
                  <>
                    <p>Explore the next use of materials recovered from end-of-life solar panels.</p>
                    <p>Material specifications, available applications and supporting evidence will be added after confirmation.</p>
                  </>
                ) : (
                  <p>EasyCycle brings your recycling records and environmental data together to support project closeout, reporting and sustainability communications.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <nav className="pv-company-topics" aria-label="Company information">
                {([
                  ["about", "About us", "/about-us/"],
                  ["mission", "Mission", "/mission/"],
                  ["approach", "Our approach", "/our-approach/"],
                  ["contact", "Contact", "/contact/"],
                ] as const).map(([id, label, href]) => (
                  <Link
                    key={id}
                    href={href}
                    data-preview-active={companyTopic === id}
                    onMouseEnter={() => setCompanyTopic(id)}
                    onFocus={() => setCompanyTopic(id)}
                    onClick={closeAll}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="pv-company-content" aria-live="polite">
                <h2>{({ about: "About us", mission: "Mission", approach: "Our approach", contact: "Contact" })[companyTopic]}</h2>
                {companyTopic === "about" ? (
                  <>
                    <p>PV Circonomy provides US solar panel recycling services using PV Circulator, developed by its parent company TSGC.</p>
                    <p>PV Circonomy also serves as a sales channel for PV Circulator equipment.</p>
                  </>
                ) : companyTopic === "mission" ? (
                  <p>Make end-of-life solar panel recycling easier to understand, with clear processing estimates, delivery terms and visibility into the recycling journey.</p>
                ) : companyTopic === "approach" ? (
                  <p>Start with the panel model, quantity and condition. Separate processing from transport costs, agree receiving conditions and document the batch through its recycling journey.</p>
                ) : (
                  <>
                    <p>For recycling inquiries, prepare your panel model, quantity, condition and US location. For equipment inquiries, specify your interest in PV Circulator.</p>
                    <p>Use the quotation tool to prepare your panel information; sending an inquiry is a separate step.</p>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {menu && (
        <div id="pv-account-menu" className="pv-header-panel pv-account-panel">
          <div className="pv-mobile-company">
            <Link href="/" onClick={() => goHome("recycling")}>Recycling</Link>
            <button type="button" onClick={() => { setMenu(false); setPanel("equipment"); }}>PV Circulator</button>
            <button type="button" className="pv-nav-disabled" disabled aria-disabled="true">Company <small>Coming soon</small></button>
            <button type="button" className="pv-nav-disabled" disabled aria-disabled="true">Shop <small>Coming soon</small></button>
          </div>
          <h2>Account</h2>
          {account ? (
            <>
              <p>{account.name}<br />{account.email}</p>
              {account.role === "staff" && <Link className="pv-button" href="/admin/orders/">Company dashboard <Arrow /></Link>}
              <button className="pv-text-button" type="button" onClick={logout}>Sign out</button>
            </>
          ) : (
            <>
              <p>Log in or sign up to use your details for quotations and delivery.</p>
              {googleReady ? (
                <a className="pv-button" href="/api/auth/google/login/">Continue with Google <Arrow /></a>
              ) : (
                <>
                  <button className="pv-button" type="button" disabled>Continue with Google</button>
                  <p className="pv-note">Google sign-up will be available once setup is complete. You can still get a quotation without an account.</p>
                </>
              )}
              <p className="pv-note">New here? Your first Google sign-in creates your account.</p>
              <a className="pv-text-button" href="/api/auth/microsoft/login/">Log in with Microsoft</a>
            </>
          )}
          {accountStatus && <p role="status">{accountStatus}</p>}
        </div>
      )}
    </header>
  );
}
