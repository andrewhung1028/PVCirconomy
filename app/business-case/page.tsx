'use client';

import { Suspense } from 'react';
import { ScenarioModel } from '../components/scenario-model';
import '../components/journey.css';

export default function BusinessCasePage() {
  return <article className="pc-journey"><header className="pc-journey-hero pc-wrap"><p className="pc-eyebrow">SCENARIO MODEL</p><h1>Scenario model — editable example assumptions</h1><p className="pc-lead">Test an operator’s own intake fees, material sales, and costs. Reference values are illustrative assumptions, not market quotations, and they are not a TSGC equipment price.</p></header><div className="pc-wrap"><Suspense fallback={<p>Loading the scenario model.</p>}><ScenarioModel /></Suspense></div></article>;
}
