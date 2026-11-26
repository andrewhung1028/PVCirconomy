 'use client';
import {usePricing} from './use-pricing';
import {residentialCopy} from '../../lib/pickup';
export function ResidentialNote(){const {pricing,loading}=usePricing();return <span>{pricing?residentialCopy(pricing.transport,pricing.batchPricing):loading?'Loading processing rates…':'Processing rates are available in the estimator when current pricing loads.'}</span>}
