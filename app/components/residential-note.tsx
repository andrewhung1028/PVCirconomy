 'use client';
import {usePricing} from './use-pricing';
import {residentialCopy} from '../../lib/pickup';
export function ResidentialNote(){const {pricing,loading}=usePricing();return <span>{pricing?residentialCopy(pricing.transport):loading?'Loading Residential pricing…':'Residential rates are available in the estimator when current pricing loads.'}</span>}
