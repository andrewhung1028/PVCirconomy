'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';

function publicPage(event: BeforeSendEvent) {
  const url = new URL(event.url);
  if (/^\/(admin|settings|api)(\/|$)/.test(url.pathname)) return null;

  // Inquiry and quotation links can carry customer details or access tokens.
  return { ...event, url: url.origin + url.pathname };
}

export function PublicWebAnalytics() {
  return <Analytics beforeSend={publicPage} />;
}
