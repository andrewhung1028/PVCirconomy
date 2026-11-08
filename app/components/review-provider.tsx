'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { emptySession, type EquipmentDraft, type ReviewSession, type ScenarioInput, type ServiceDraft, type TestOrder } from '@/lib/commerce/model';

const KEY = 'pvc-review-session-v2';

type Api = {
  ready: boolean;
  session: ReviewSession;
  patchService: (patch: Partial<ServiceDraft>) => void;
  patchEquipment: (patch: Partial<EquipmentDraft>) => void;
  setScenario: (scenario: ScenarioInput) => void;
  markServiceEstimated: () => void;
  markEquipmentConfigured: () => void;
  attachScenario: () => void;
  clearOrder: () => void;
  saveOrder: (order: TestOrder) => void;
  reset: () => void;
};

const ReviewContext = createContext<Api | null>(null);

function mergeSession(value: unknown): ReviewSession {
  const base = emptySession();
  if (!value || typeof value !== 'object') return base;
  const raw = value as Partial<ReviewSession>;
  return {
    ...base,
    ...raw,
    service: { ...base.service, ...(raw.service ?? {}) },
    equipment: { ...base.equipment, ...(raw.equipment ?? {}) },
    scenario: {
      ...base.scenario,
      ...(raw.scenario ?? {}),
      materials: raw.scenario?.materials?.length ? raw.scenario.materials : base.scenario.materials,
    },
    order: raw.order ?? null,
  };
}

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ReviewSession>(emptySession);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved) setSession(mergeSession(JSON.parse(saved)));
    } catch { /* keep the blank session */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) sessionStorage.setItem(KEY, JSON.stringify(session));
  }, [ready, session]);
  const api = useMemo<Api>(() => ({
    ready,
    session,
    patchService: patch => setSession(current => ({ ...current, service: { ...current.service, ...patch }, order: null, serviceStatus: current.serviceStatus === 'test_created' ? 'estimated' : current.serviceStatus })),
    patchEquipment: patch => setSession(current => ({ ...current, equipment: { ...current.equipment, ...patch }, order: null, equipmentStatus: current.equipmentStatus === 'test_created' ? 'configured' : current.equipmentStatus })),
    setScenario: scenario => setSession(current => ({ ...current, scenario, order: null })),
    markServiceEstimated: () => setSession(current => ({ ...current, serviceStatus: 'estimated', order: null })),
    markEquipmentConfigured: () => setSession(current => ({ ...current, equipmentStatus: 'configured', order: null })),
    attachScenario: () => setSession(current => ({ ...current, attachScenario: true, order: null, equipmentStatus: current.equipmentStatus === 'draft' ? 'configured' : current.equipmentStatus })),
    clearOrder: () => setSession(current => ({ ...current, order: null })),
    saveOrder: order => setSession(current => ({ ...current, order, serviceStatus: current.serviceStatus === 'draft' ? 'draft' : 'test_created', equipmentStatus: current.equipmentStatus === 'draft' ? 'draft' : 'test_created' })),
    reset: () => setSession(emptySession()),
  }), [ready, session]);
  return <ReviewContext.Provider value={api}>{children}</ReviewContext.Provider>;
}

export function useReview() {
  const value = useContext(ReviewContext);
  if (!value) throw new Error('Review session is unavailable');
  return value;
}
