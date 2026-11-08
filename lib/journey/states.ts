export const SERVICE_STAGES = [
  { id: 'qualified_intake', label: 'Qualified intake', trustedBackend: false },
  { id: 'pending_review', label: 'Pending-review case', trustedBackend: true },
  { id: 'approved_quote', label: 'Approved versioned quote', trustedBackend: true },
  { id: 'customer_acceptance', label: 'Customer acceptance', trustedBackend: true },
  { id: 'order', label: 'Order', trustedBackend: true },
  { id: 'confirmed_logistics', label: 'Confirmed logistics', trustedBackend: true },
  { id: 'completion_documents', label: 'Completion documents', trustedBackend: true },
] as const;

export type ServiceStageId = (typeof SERVICE_STAGES)[number]['id'];

export const FRONTEND_COMMERCIAL_ACTIONS = [
  'approve_quote',
  'accept_quote',
  'place_order',
  'confirm_logistics',
  'issue_documents',
  'pay',
] as const;

export type FrontendCommercialAction = (typeof FRONTEND_COMMERCIAL_ACTIONS)[number];

export type FrontendTransitionResult = {
  ok: false;
  submitted: false;
  caseCreated: false;
  stage: 'draft_pending_review';
  stageUnchanged: true;
  action: FrontendCommercialAction;
  message: string;
};

const REFUSAL = 'This step needs a trusted backend record. A control on this website cannot approve a quote, record acceptance, place an order, confirm logistics, take payment, or issue documents.';

export function frontendTransition(action: FrontendCommercialAction): FrontendTransitionResult {
  return {
    ok: false,
    submitted: false,
    caseCreated: false,
    stage: 'draft_pending_review',
    stageUnchanged: true,
    action,
    message: REFUSAL,
  };
}

export function previewReferenceLabel(): 'Preview reference — not submitted' {
  return 'Preview reference — not submitted';
}
