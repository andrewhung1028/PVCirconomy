export const PREVIEW_EVENTS = [
  'intent_selected',
  'intake_started',
  'intake_validated',
  'scenario_valid',
  'evidence_viewed',
  'technical_request',
] as const;

export const COMMERCIAL_EVENTS = [
  'commercial_case',
  'quote_approved',
  'order_placed',
  'logistics_confirmed',
  'fulfilled',
  'documents_issued',
] as const;

export type PreviewEventName = (typeof PREVIEW_EVENTS)[number];
export type CommercialEventName = (typeof COMMERCIAL_EVENTS)[number];

export type PreviewEvent =
  | { name: 'intent_selected'; intent: 'service' | 'equipment'; campaign?: string }
  | { name: 'intake_started' }
  | { name: 'intake_validated'; exceptionCount: number }
  | { name: 'scenario_valid'; configuration: string }
  | { name: 'evidence_viewed'; sourceId: string }
  | { name: 'technical_request' };

export type CommercialEvent = { name: CommercialEventName };

export type RecordedEventResult = {
  accepted: boolean;
  delivered: false;
  reason: 'preview_noop' | 'commercial_state_requires_trusted_backend' | 'unknown_event';
};

const memory: PreviewEvent[] = [];

export function resetPreviewEvents() {
  memory.splice(0, memory.length);
}

export function previewEventLog(): readonly PreviewEvent[] {
  return memory;
}

export function recordPreviewEvent(event: PreviewEvent | CommercialEvent | { name: string }): RecordedEventResult {
  if ((COMMERCIAL_EVENTS as readonly string[]).includes(event.name)) {
    return { accepted: false, delivered: false, reason: 'commercial_state_requires_trusted_backend' };
  }
  if (!(PREVIEW_EVENTS as readonly string[]).includes(event.name)) {
    return { accepted: false, delivered: false, reason: 'unknown_event' };
  }
  memory.push(event as PreviewEvent);
  return { accepted: true, delivered: false, reason: 'preview_noop' };
}
