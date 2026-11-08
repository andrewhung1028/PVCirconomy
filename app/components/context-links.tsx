'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';
import { buildJourneyHref, businessCaseHref, readJourneyContext, type JourneyIntent } from '@/lib/journey/context';
import { recordPreviewEvent } from '@/lib/journey/events';

export function PreserveContextLink({ href, intent, className, children }: { href: string; intent?: JourneyIntent; className?: string; children: ReactNode }) {
  const current = readJourneyContext(useSearchParams().toString());
  const next = buildJourneyHref(href, { ...current, intent: intent ?? current.intent });
  return <Link className={className} href={next}>{children}</Link>;
}

export function BusinessCaseLink({ className, children }: { className?: string; children: ReactNode }) {
  const current = readJourneyContext(useSearchParams().toString());
  return <a className={className ?? 'pc-button'} href={businessCaseHref(current)}>{children}</a>;
}

export function IntentBeacon() {
  const params = useSearchParams();
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    const current = readJourneyContext(params.toString());
    if (!current.intent) return;
    once.current = true;
    recordPreviewEvent({ name: 'intent_selected', intent: current.intent, campaign: current.utm_campaign || undefined });
  }, [params]);
  return null;
}

export function UrlGuard() {
  const params = useSearchParams();
  useEffect(() => {
    const current = readJourneyContext(params.toString());
    if (!current.stripped.length) return;
    const clean = buildJourneyHref(`${window.location.pathname}${window.location.hash}`, current);
    if (clean !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(null, '', clean);
    }
  }, [params]);
  return null;
}

export function EvidenceBeacon({ sourceId }: { sourceId: string }) {
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    recordPreviewEvent({ name: 'evidence_viewed', sourceId });
  }, [sourceId]);
  return null;
}
